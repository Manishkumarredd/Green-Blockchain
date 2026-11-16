const db = require("../config/db");
const { AppError } = require("../utils/errorHandler");

class ProducerService {
  async createListing({ producerId, energySource, totalEnergyKwh, pricePerKwh, minPurchaseKwh = 1.0, windowHours = 24 }) {
    if (db.isConnected) {
      const sql = `
        INSERT INTO energy_listings (producer_id, energy_source, total_energy_kwh, available_energy_kwh, price_per_kwh, min_purchase_kwh, listing_status, listing_window_start, listing_window_end)
        VALUES ($1, $2, $3, $3, $4, $5, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + ($6 || ' hours')::INTERVAL)
        RETURNING *
      `;
      const res = await db.query(sql, [producerId, energySource, totalEnergyKwh, pricePerKwh, minPurchaseKwh, windowHours]);
      return res.rows[0];
    } else {
      const newListing = {
        id: db.inMemoryStore.energy_listings.length + 1,
        producer_id: producerId,
        energy_source: energySource,
        total_energy_kwh: totalEnergyKwh,
        available_energy_kwh: totalEnergyKwh,
        price_per_kwh: pricePerKwh.toFixed(8),
        unit_price_eth: pricePerKwh.toFixed(8),
        min_purchase_kwh: minPurchaseKwh,
        listing_status: "ACTIVE",
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
      };
      db.inMemoryStore.energy_listings.push(newListing);
      return newListing;
    }
  }

  async getProducerListings(producerId) {
    if (db.isConnected) {
      const res = await db.query(
        "SELECT * FROM energy_listings WHERE producer_id = $1 ORDER BY created_at DESC",
        [producerId]
      );
      return res.rows;
    } else {
      return db.inMemoryStore.energy_listings.filter((l) => l.producer_id === producerId);
    }
  }

  async getListingById(id) {
    let listing = null;
    if (db.isConnected) {
      const res = await db.query(
        `SELECT l.*, u.full_name as producer_name, u.reputation_score, u.wallet_address as producer_wallet
         FROM energy_listings l
         JOIN users u ON l.producer_id = u.id
         WHERE l.id = $1`,
        [id]
      );
      listing = res.rows[0];
    } else {
      const l = db.inMemoryStore.energy_listings.find((item) => item.id === Number(id));
      if (l) {
        const u = db.inMemoryStore.users.find((user) => user.id === l.producer_id) || {};
        listing = {
          ...l,
          producer_name: u.full_name || u.name,
          reputation_score: u.reputation_score,
          producer_wallet: u.wallet_address,
        };
      }
    }

    if (!listing) {
      throw new AppError("Energy listing not found.", 404);
    }
    return listing;
  }

  async updateListing(id, producerId, updates) {
    const listing = await this.getListingById(id);
    if (listing.producer_id !== producerId) {
      throw new AppError("Unauthorized: You do not own this energy listing.", 403);
    }

    if (listing.listing_status === "FILLED" || listing.listing_status === "CANCELLED") {
      throw new AppError(`Cannot update listing that is already ${listing.listing_status}.`, 400);
    }

    if (updates.availableEnergyKwh !== undefined && updates.availableEnergyKwh > listing.total_energy_kwh) {
      throw new AppError("Available energy cannot exceed total listing capacity.", 400);
    }

    if (db.isConnected) {
      const fields = [];
      const values = [];
      let idx = 1;

      if (updates.availableEnergyKwh !== undefined) {
        fields.push(`available_energy_kwh = $${idx++}`);
        values.push(updates.availableEnergyKwh);
      }
      if (updates.pricePerKwh !== undefined) {
        fields.push(`price_per_kwh = $${idx++}`);
        values.push(updates.pricePerKwh);
      }
      if (updates.listingStatus) {
        fields.push(`listing_status = $${idx++}`);
        values.push(updates.listingStatus);
      }
      if (updates.minPurchaseKwh !== undefined) {
        fields.push(`min_purchase_kwh = $${idx++}`);
        values.push(updates.minPurchaseKwh);
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const sql = `UPDATE energy_listings SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
      const res = await db.query(sql, values);
      return res.rows[0];
    } else {
      const item = db.inMemoryStore.energy_listings.find((l) => l.id === Number(id));
      if (updates.availableEnergyKwh !== undefined) item.available_energy_kwh = updates.availableEnergyKwh;
      if (updates.pricePerKwh !== undefined) item.price_per_kwh = updates.pricePerKwh.toFixed(8);
      if (updates.listingStatus) {
        item.listing_status = updates.listingStatus;
        item.status = updates.listingStatus;
      }
      if (updates.minPurchaseKwh !== undefined) item.min_purchase_kwh = updates.minPurchaseKwh;
      item.updated_at = new Date();
      return item;
    }
  }

  async deleteListing(id, producerId) {
    const listing = await this.getListingById(id);
    if (listing.producer_id !== producerId) {
      throw new AppError("Unauthorized: You do not own this energy listing.", 403);
    }

    // Check if listing has associated completed transactions
    let hasTransactions = false;
    if (db.isConnected) {
      const txCheck = await db.query(
        "SELECT id FROM energy_transactions WHERE listing_id = $1 AND transaction_status IN ('SETTLED', 'CONFIRMED')",
        [id]
      );
      hasTransactions = txCheck.rows.length > 0;
    } else {
      hasTransactions = db.inMemoryStore.energy_transactions.some(
        (t) => t.listing_id === Number(id) && (t.transaction_status === "SETTLED" || t.transaction_status === "CONFIRMED")
      );
    }

    if (hasTransactions) {
      // Instead of hard deleting records tied to transactions, gracefully mark as CANCELLED
      return await this.updateListing(id, producerId, { listingStatus: "CANCELLED" });
    }

    if (db.isConnected) {
      await db.query("DELETE FROM energy_listings WHERE id = $1", [id]);
    } else {
      const idx = db.inMemoryStore.energy_listings.findIndex((l) => l.id === Number(id));
      if (idx !== -1) db.inMemoryStore.energy_listings.splice(idx, 1);
    }

    return { id: Number(id), deleted: true, message: "Listing deleted successfully." };
  }

  async getProducerDashboardStats(producerId) {
    const listings = await this.getProducerListings(producerId);

    let transactions = [];
    if (db.isConnected) {
      const res = await db.query(
        "SELECT * FROM energy_transactions WHERE producer_id = $1 ORDER BY created_at DESC",
        [producerId]
      );
      transactions = res.rows;
    } else {
      transactions = db.inMemoryStore.energy_transactions.filter((t) => t.producer_id === producerId);
    }

    const totalOfferedKwh = listings.reduce((sum, l) => sum + Number(l.total_energy_kwh || 0), 0);
    const availableKwh = listings
      .filter((l) => (l.listing_status || l.status) === "ACTIVE")
      .reduce((sum, l) => sum + Number(l.available_energy_kwh || 0), 0);
    const totalSoldKwh = transactions.reduce((sum, t) => sum + Number(t.energy_quantity_kwh || 0), 0);
    const totalEarningsEth = transactions.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);

    return {
      totalOfferedKwh,
      availableKwh,
      totalSoldKwh,
      totalEarningsEth: totalEarningsEth.toFixed(8),
      activeListingsCount: listings.filter((l) => (l.listing_status || l.status) === "ACTIVE").length,
      totalTransactionsCount: transactions.length,
      recentTransactions: transactions.slice(0, 5),
    };
  }
}

module.exports = new ProducerService();
