const db = require("../config/db");
const { AppError } = require("../utils/errorHandler");

class MarketplaceService {
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

      if (energySource) {
        conditions.push(`l.energy_source = $${idx++}`);
        params.push(energySource.toUpperCase());
      }
      if (minPrice !== undefined) {
        conditions.push(`l.price_per_kwh >= $${idx++}`);
        params.push(minPrice);
      }
      if (maxPrice !== undefined) {
        conditions.push(`l.price_per_kwh <= $${idx++}`);
        params.push(maxPrice);
      }
      if (minEnergy !== undefined) {
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
          page,
          limit,
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

      if (energySource) {
        items = items.filter((l) => l.energy_source.toLowerCase() === energySource.toLowerCase());
      }
      if (minPrice !== undefined) {
        items = items.filter((l) => Number(l.price_per_kwh) >= minPrice);
      }
      if (maxPrice !== undefined) {
        items = items.filter((l) => Number(l.price_per_kwh) <= maxPrice);
      }
      if (minEnergy !== undefined) {
        items = items.filter((l) => l.available_energy_kwh >= minEnergy);
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
          page,
          limit,
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
        reputation_score: u.reputation_score,
        producer_wallet: u.wallet_address,
        capacity_kw: 250.0,
        location_grid: "Microgrid-Alpha-Sector-1",
      };
    }
  }
}

module.exports = new MarketplaceService();
