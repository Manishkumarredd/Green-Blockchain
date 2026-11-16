const db = require("../config/db");
const { AppError } = require("../utils/errorHandler");

class TransactionService {
  async createTransaction({ consumerId, listingId, energyQuantityKwh, maxPricePerKwh }) {
    if (db.isConnected) {
      const client = await db.getClient();
      try {
        await client.query("BEGIN");

        // 1. Row-level lock on listing to strictly prevent concurrent overselling
        const listingRes = await client.query(
          "SELECT * FROM energy_listings WHERE id = $1 FOR UPDATE",
          [listingId]
        );

        if (listingRes.rows.length === 0) {
          throw new AppError("Energy listing does not exist.", 404);
        }

        const listing = listingRes.rows[0];

        if (listing.listing_status !== "ACTIVE" && listing.listing_status !== "PARTIALLY_FILLED") {
          throw new AppError(`Listing is not eligible for purchase (Status: ${listing.listing_status}).`, 400);
        }

        if (listing.producer_id === consumerId) {
          throw new AppError("Producers cannot purchase their own energy listings.", 400);
        }

        const available = Number(listing.available_energy_kwh);
        if (available < energyQuantityKwh) {
          throw new AppError(
            `Insufficient energy available. Requested: ${energyQuantityKwh} kWh, Available: ${available} kWh.`,
            400
          );
        }

        const pricePerKwh = Number(listing.price_per_kwh);
        if (maxPricePerKwh && pricePerKwh > maxPricePerKwh) {
          throw new AppError(
            `Listing price (${pricePerKwh} ETH) exceeds your maximum acceptable price (${maxPricePerKwh} ETH).`,
            400
          );
        }

        const totalAmount = Number((energyQuantityKwh * pricePerKwh).toFixed(8));
        const newAvailable = Number((available - energyQuantityKwh).toFixed(2));
        const newStatus = newAvailable === 0 ? "FILLED" : "PARTIALLY_FILLED";

        // 2. Decrement available energy on listing
        await client.query(
          "UPDATE energy_listings SET available_energy_kwh = $1, listing_status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
          [newAvailable, newStatus, listingId]
        );

        // 3. Insert transaction
        const txRes = await client.query(
          `INSERT INTO energy_transactions (producer_id, consumer_id, listing_id, energy_quantity_kwh, price_per_kwh, total_amount, transaction_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED')
           RETURNING *`,
          [listing.producer_id, consumerId, listingId, energyQuantityKwh, pricePerKwh, totalAmount]
        );
        const transaction = txRes.rows[0];

        // 4. Insert corresponding carbon record (0.8200 kg CO2 / kWh grid factor)
        const carbonSaved = Number((energyQuantityKwh * 0.82).toFixed(2));
        await client.query(
          `INSERT INTO carbon_records (transaction_id, renewable_energy_kwh, grid_emission_factor, estimated_carbon_savings)
           VALUES ($1, $2, 0.8200, $3)`,
          [transaction.id, energyQuantityKwh, carbonSaved]
        );

        // 5. Log activity
        await client.query(
          `INSERT INTO activity_logs (user_id, action, description)
           VALUES ($1, 'ENERGY_PURCHASED', $2)`,
          [consumerId, `Purchased ${energyQuantityKwh} kWh at ${pricePerKwh} ETH from Listing #${listingId}`]
        );

        await client.query("COMMIT");
        return {
          ...transaction,
          carbonSavedKg: carbonSaved,
        };
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } else {
      // In-Memory Transaction Execution
      const listing = db.inMemoryStore.energy_listings.find((l) => l.id === Number(listingId));
      if (!listing) {
        throw new AppError("Energy listing does not exist.", 404);
      }

      const status = listing.listing_status || listing.status;
      if (status !== "ACTIVE" && status !== "PARTIALLY_FILLED") {
        throw new AppError(`Listing is not eligible for purchase (Status: ${status}).`, 400);
      }

      if (listing.producer_id === consumerId) {
        throw new AppError("Producers cannot purchase their own energy listings.", 400);
      }

      const available = Number(listing.available_energy_kwh || listing.available_kwh);
      if (available < energyQuantityKwh) {
        throw new AppError(
          `Insufficient energy available. Requested: ${energyQuantityKwh} kWh, Available: ${available} kWh.`,
          400
        );
      }

      const pricePerKwh = Number(listing.price_per_kwh || listing.unit_price_eth);
      if (maxPricePerKwh && pricePerKwh > maxPricePerKwh) {
        throw new AppError(
          `Listing price (${pricePerKwh} ETH) exceeds your maximum acceptable price (${maxPricePerKwh} ETH).`,
          400
        );
      }

      const totalAmount = Number((energyQuantityKwh * pricePerKwh).toFixed(8));
      const newAvailable = Number((available - energyQuantityKwh).toFixed(2));
      const newStatus = newAvailable === 0 ? "FILLED" : "PARTIALLY_FILLED";

      // Decrement available energy atomically
      listing.available_energy_kwh = newAvailable;
      listing.available_kwh = newAvailable;
      listing.listing_status = newStatus;
      listing.status = newStatus;
      listing.updated_at = new Date();

      const newTx = {
        id: db.inMemoryStore.energy_transactions.length + 1,
        producer_id: listing.producer_id,
        consumer_id: consumerId,
        listing_id: Number(listingId),
        energy_quantity_kwh: energyQuantityKwh,
        price_per_kwh: pricePerKwh.toFixed(8),
        total_amount: totalAmount.toFixed(8),
        transaction_status: "CONFIRMED",
        blockchain_transaction_hash: null,
        created_at: new Date(),
      };
      db.inMemoryStore.energy_transactions.push(newTx);

      const carbonSaved = Number((energyQuantityKwh * 0.82).toFixed(2));
      const carbonRecord = {
        id: db.inMemoryStore.carbon_records.length + 1,
        transaction_id: newTx.id,
        renewable_energy_kwh: energyQuantityKwh,
        grid_emission_factor: 0.82,
        estimated_carbon_savings: carbonSaved,
        created_at: new Date(),
      };
      db.inMemoryStore.carbon_records.push(carbonRecord);

      return {
        ...newTx,
        carbonSavedKg: carbonSaved,
      };
    }
  }

  async getTransactionById(id) {
    if (db.isConnected) {
      const sql = `
        SELECT 
          t.*,
          p.full_name as producer_name,
          p.wallet_address as producer_wallet,
          c.full_name as consumer_name,
          c.wallet_address as consumer_wallet,
          l.energy_source,
          cr.estimated_carbon_savings
        FROM energy_transactions t
        JOIN users p ON t.producer_id = p.id
        JOIN users c ON t.consumer_id = c.id
        LEFT JOIN energy_listings l ON t.listing_id = l.id
        LEFT JOIN carbon_records cr ON cr.transaction_id = t.id
        WHERE t.id = $1
      `;
      const res = await db.query(sql, [id]);
      if (res.rows.length === 0) throw new AppError("Transaction not found.", 404);
      return res.rows[0];
    } else {
      const t = db.inMemoryStore.energy_transactions.find((item) => item.id === Number(id));
      if (!t) throw new AppError("Transaction not found.", 404);

      const p = db.inMemoryStore.users.find((u) => u.id === t.producer_id) || {};
      const c = db.inMemoryStore.users.find((u) => u.id === t.consumer_id) || {};
      const l = db.inMemoryStore.energy_listings.find((item) => item.id === t.listing_id) || {};
      const cr = db.inMemoryStore.carbon_records.find((r) => r.transaction_id === t.id) || {};

      return {
        ...t,
        producer_name: p.full_name || p.name,
        producer_wallet: p.wallet_address,
        consumer_name: c.full_name || c.name,
        consumer_wallet: c.wallet_address,
        energy_source: l.energy_source || "SOLAR",
        estimated_carbon_savings: cr.estimated_carbon_savings || Number((t.energy_quantity_kwh * 0.82).toFixed(2)),
      };
    }
  }

  async getUserTransactions(userId, role) {
    if (db.isConnected) {
      const whereCondition = role === "PRODUCER" ? "t.producer_id = $1" : role === "CONSUMER" ? "t.consumer_id = $1" : "1=1";
      const params = role === "ADMIN" ? [] : [userId];
      const sql = `
        SELECT 
          t.*,
          p.full_name as producer_name,
          c.full_name as consumer_name,
          l.energy_source,
          cr.estimated_carbon_savings
        FROM energy_transactions t
        JOIN users p ON t.producer_id = p.id
        JOIN users c ON t.consumer_id = c.id
        LEFT JOIN energy_listings l ON t.listing_id = l.id
        LEFT JOIN carbon_records cr ON cr.transaction_id = t.id
        WHERE ${whereCondition}
        ORDER BY t.created_at DESC
      `;
      const res = await db.query(sql, params);
      return res.rows;
    } else {
      let txs = db.inMemoryStore.energy_transactions;
      if (role === "PRODUCER") txs = txs.filter((t) => t.producer_id === userId);
      if (role === "CONSUMER") txs = txs.filter((t) => t.consumer_id === userId);

      return txs.map((t) => {
        const p = db.inMemoryStore.users.find((u) => u.id === t.producer_id) || {};
        const c = db.inMemoryStore.users.find((u) => u.id === t.consumer_id) || {};
        const l = db.inMemoryStore.energy_listings.find((item) => item.id === t.listing_id) || {};
        const cr = db.inMemoryStore.carbon_records.find((r) => r.transaction_id === t.id) || {};

        return {
          ...t,
          producer_name: p.full_name || p.name,
          consumer_name: c.full_name || c.name,
          energy_source: l.energy_source || "SOLAR",
          estimated_carbon_savings: cr.estimated_carbon_savings || Number((t.energy_quantity_kwh * 0.82).toFixed(2)),
        };
      });
    }
  }

  async getAllTransactions() {
    return this.getUserTransactions(null, "ADMIN");
  }
}

module.exports = new TransactionService();
