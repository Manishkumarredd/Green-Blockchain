const db = require("../config/db");
const { AppError } = require("../utils/errorHandler");

class MarketplaceService {
  async getMarketplaceSummary() {
    if (db.isConnected) {
      const res = await db.query(`
        SELECT 
          COUNT(*) as active_listings,
          COALESCE(SUM(available_energy_kwh), 0) as total_available_kwh,
          COUNT(DISTINCT energy_source) as distinct_sources,
          COALESCE(MIN(price_per_kwh), 0) as min_price,
          COALESCE(AVG(price_per_kwh), 0) as avg_price,
          COALESCE(MAX(price_per_kwh), 0) as max_price
        FROM energy_listings
        WHERE listing_status = 'ACTIVE' AND available_energy_kwh > 0
      `);
      const row = res.rows[0];
      return {
        activeListingsCount: parseInt(row.active_listings, 10),
        totalAvailableKwh: Number(row.total_available_kwh),
        distinctSourcesCount: parseInt(row.distinct_sources, 10),
        minPriceEth: Number(row.min_price).toFixed(8),
        avgPriceEth: Number(row.avg_price).toFixed(8),
        maxPriceEth: Number(row.max_price).toFixed(8),
      };
    } else {
      const active = db.inMemoryStore.energy_listings.filter(
        (l) => (l.listing_status || l.status) === "ACTIVE" && Number(l.available_energy_kwh || l.available_kwh || 0) > 0
      );
      const totalAvailable = active.reduce((sum, l) => sum + Number(l.available_energy_kwh || l.available_kwh || 0), 0);
      const sources = new Set(active.map((l) => l.energy_source));
      const prices = active.map((l) => Number(l.price_per_kwh || l.unit_price_eth));
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      const avgPrice = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;

      return {
        activeListingsCount: active.length,
        totalAvailableKwh: totalAvailable,
        distinctSourcesCount: sources.size,
        minPriceEth: minPrice.toFixed(8),
        avgPriceEth: avgPrice.toFixed(8),
        maxPriceEth: maxPrice.toFixed(8),
      };
    }
  }

  async getMarketplaceListings({
    page = 1,
    limit = 10,
    energySource,
    minPrice,
    maxPrice,
    minEnergy,
    sortBy = "price_asc",
    search,
  }) {
    const offset = (page - 1) * limit;

    if (db.isConnected) {
      const conditions = ["l.listing_status = 'ACTIVE'", "l.available_energy_kwh > 0"];
      const params = [];
      let idx = 1;

      if (energySource && energySource !== "ALL") {
        conditions.push(`l.energy_source = $${idx++}`);
        params.push(energySource.toUpperCase());
      }
      if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
        conditions.push(`l.price_per_kwh >= $${idx++}`);
        params.push(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
        conditions.push(`l.price_per_kwh <= $${idx++}`);
        params.push(maxPrice);
      }
      if (minEnergy !== undefined && minEnergy !== null && minEnergy !== "") {
        conditions.push(`l.available_energy_kwh >= $${idx++}`);
        params.push(minEnergy);
      }
      if (search) {
        conditions.push(`(u.full_name ILIKE $${idx} OR l.energy_source ILIKE $${idx})`);
        params.push(`%${search}%`);
        idx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      let orderBy = "l.price_per_kwh ASC";
      if (sortBy === "price_desc") orderBy = "l.price_per_kwh DESC";
      if (sortBy === "quantity_asc") orderBy = "l.available_energy_kwh ASC";
      if (sortBy === "quantity_desc") orderBy = "l.available_energy_kwh DESC";
      if (sortBy === "created_desc") orderBy = "l.created_at DESC";

      const countSql = `
        SELECT COUNT(*) as total
        FROM energy_listings l
        JOIN users u ON l.producer_id = u.id
        ${whereClause}
      `;
      const countRes = await db.query(countSql, params);
      const total = parseInt(countRes.rows[0].total, 10);

      const dataSql = `
        SELECT 
          l.id,
          l.producer_id,
          u.full_name as producer_name,
          u.reputation_score,
          u.wallet_address as producer_wallet,
          l.energy_source,
          l.total_energy_kwh,
          l.available_energy_kwh,
          l.price_per_kwh,
          l.min_purchase_kwh,
          l.listing_status,
          l.created_at
        FROM energy_listings l
        JOIN users u ON l.producer_id = u.id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${idx++} OFFSET $${idx++}
      `;
      params.push(limit, offset);
      const dataRes = await db.query(dataSql, params);

      return {
        listings: dataRes.rows,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    } else {
      // In-Memory Search & Filter
      let items = db.inMemoryStore.energy_listings.filter(
        (l) => (l.listing_status || l.status) === "ACTIVE" && Number(l.available_energy_kwh || l.available_kwh || 0) > 0
      );

      // Hydrate producer information
      items = items.map((l) => {
        const u = db.inMemoryStore.users.find((user) => user.id === l.producer_id) || {};
        return {
          id: l.id,
          producer_id: l.producer_id,
          producer_name: u.full_name || u.name || "Renewable Producer",
          reputation_score: u.reputation_score || 99.0,
          producer_wallet: u.wallet_address || "",
          energy_source: l.energy_source,
          total_energy_kwh: Number(l.total_energy_kwh || l.quantity_kwh || 0),
          available_energy_kwh: Number(l.available_energy_kwh || l.available_kwh || 0),
          price_per_kwh: l.price_per_kwh || l.unit_price_eth,
          min_purchase_kwh: Number(l.min_purchase_kwh || 1.0),
          listing_status: l.listing_status || l.status,
          created_at: l.created_at || new Date(),
        };
      });

      if (energySource && energySource !== "ALL") {
        items = items.filter((l) => l.energy_source.toLowerCase() === energySource.toLowerCase());
      }
      if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
        items = items.filter((l) => Number(l.price_per_kwh) >= Number(minPrice));
      }
      if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
        items = items.filter((l) => Number(l.price_per_kwh) <= Number(maxPrice));
      }
      if (minEnergy !== undefined && minEnergy !== null && minEnergy !== "") {
        items = items.filter((l) => l.available_energy_kwh >= Number(minEnergy));
      }
      if (search) {
        const term = search.toLowerCase();
        items = items.filter(
          (l) => l.producer_name.toLowerCase().includes(term) || l.energy_source.toLowerCase().includes(term)
        );
      }

      // Sorting
      if (sortBy === "price_asc") items.sort((a, b) => Number(a.price_per_kwh) - Number(b.price_per_kwh));
      if (sortBy === "price_desc") items.sort((a, b) => Number(b.price_per_kwh) - Number(a.price_per_kwh));
      if (sortBy === "quantity_asc") items.sort((a, b) => a.available_energy_kwh - b.available_energy_kwh);
      if (sortBy === "quantity_desc") items.sort((a, b) => b.available_energy_kwh - a.available_energy_kwh);
      if (sortBy === "created_desc") items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const total = items.length;
      const paginated = items.slice(offset, offset + limit);

      return {
        listings: paginated,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }
  }

  async getListingDetails(id) {
    if (db.isConnected) {
      const sql = `
        SELECT 
          l.*,
          u.full_name as producer_name,
          u.email as producer_email,
          u.reputation_score,
          u.wallet_address as producer_wallet,
          u.meter_id as producer_meter_id,
          pp.capacity_kw,
          pp.location_grid
        FROM energy_listings l
        JOIN users u ON l.producer_id = u.id
        LEFT JOIN producer_profiles pp ON pp.user_id = u.id
        WHERE l.id = $1
      `;
      const res = await db.query(sql, [id]);
      if (res.rows.length === 0) throw new AppError("Listing not found.", 404);
      return res.rows[0];
    } else {
      const l = db.inMemoryStore.energy_listings.find((item) => item.id === Number(id));
      if (!l) throw new AppError("Listing not found.", 404);
      const u = db.inMemoryStore.users.find((user) => user.id === l.producer_id) || {};
      return {
        ...l,
        producer_name: u.full_name || u.name,
        producer_email: u.email,
        reputation_score: u.reputation_score || 99.2,
        producer_wallet: u.wallet_address,
        producer_meter_id: u.meter_id || "METER-PROD-SOL-101",
        capacity_kw: 250.0,
        location_grid: "Microgrid-Alpha-Sector-1",
      };
    }
  }
}

module.exports = new MarketplaceService();
