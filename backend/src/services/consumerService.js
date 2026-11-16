const db = require("../config/db");
const { AppError } = require("../utils/errorHandler");

class ConsumerService {
  async createRequest({ consumerId, requestedEnergyKwh, priorityWeight = 1.0, maxAcceptablePrice, urgencyLevel = "NORMAL" }) {
    if (db.isConnected) {
      const sql = `
        INSERT INTO energy_requests (consumer_id, requested_energy_kwh, priority_weight, max_acceptable_price, urgency_level, request_status)
        VALUES ($1, $2, $3, $4, $5, 'PENDING')
        RETURNING *
      `;
      const res = await db.query(sql, [consumerId, requestedEnergyKwh, priorityWeight, maxAcceptablePrice || null, urgencyLevel]);
      return res.rows[0];
    } else {
      const newRequest = {
        id: db.inMemoryStore.energy_requests.length + 1,
        consumer_id: consumerId,
        requested_energy_kwh: requestedEnergyKwh,
        requested_kwh: requestedEnergyKwh,
        priority_weight: priorityWeight,
        max_acceptable_price: maxAcceptablePrice ? maxAcceptablePrice.toFixed(8) : "0.00012000",
        urgency_level: urgencyLevel,
        request_status: "PENDING",
        status: "PENDING",
        created_at: new Date(),
      };
      db.inMemoryStore.energy_requests.push(newRequest);
      return newRequest;
    }
  }

  async getConsumerRequests(consumerId) {
    if (db.isConnected) {
      const res = await db.query(
        "SELECT * FROM energy_requests WHERE consumer_id = $1 ORDER BY created_at DESC",
        [consumerId]
      );
      return res.rows;
    } else {
      return db.inMemoryStore.energy_requests.filter((r) => r.consumer_id === consumerId);
    }
  }

  async getConsumerAllocations(consumerId) {
    if (db.isConnected) {
      const sql = `
        SELECT ad.*, ar.algorithm_name, ar.jain_fairness_index, ar.created_at as cycle_time
        FROM allocation_details ad
        JOIN allocation_results ar ON ad.allocation_result_id = ar.id
        WHERE ad.consumer_id = $1
        ORDER BY ar.created_at DESC
      `;
      const res = await db.query(sql, [consumerId]);
      return res.rows;
    } else {
      return db.inMemoryStore.allocation_details
        .filter((d) => d.consumer_id === consumerId)
        .map((d) => {
          const res = db.inMemoryStore.allocation_results.find((r) => r.id === d.allocation_result_id) || {};
          return {
            ...d,
            algorithm_name: res.algorithm_name || "WEIGHTED_PROPORTIONAL",
            jain_fairness_index: res.jain_fairness_index || 1.0,
            cycle_time: res.created_at || new Date(),
          };
        });
    }
  }

  async getConsumerDashboardStats(consumerId) {
    const requests = await this.getConsumerRequests(consumerId);

    let transactions = [];
    if (db.isConnected) {
      const res = await db.query(
        "SELECT * FROM energy_transactions WHERE consumer_id = $1 ORDER BY created_at DESC",
        [consumerId]
      );
      transactions = res.rows;
    } else {
      transactions = db.inMemoryStore.energy_transactions.filter((t) => t.consumer_id === consumerId);
    }

    const totalRequestedKwh = requests.reduce((sum, r) => sum + Number(r.requested_energy_kwh || r.requested_kwh || 0), 0);
    const totalPurchasedKwh = transactions.reduce((sum, t) => sum + Number(t.energy_quantity_kwh || 0), 0);
    const totalSpentEth = transactions.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const carbonSavedKg = (totalPurchasedKwh * 0.82).toFixed(2);

    return {
      totalRequestedKwh,
      totalPurchasedKwh,
      totalSpentEth: totalSpentEth.toFixed(8),
      carbonSavedKg: Number(carbonSavedKg),
      pendingRequestsCount: requests.filter((r) => (r.request_status || r.status) === "PENDING").length,
      totalTransactionsCount: transactions.length,
      recentTransactions: transactions.slice(0, 5),
    };
  }
}

module.exports = new ConsumerService();
