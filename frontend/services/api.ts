/**
 * GreenLedger Production API Client
 * Phase 4: Full-Stack Express REST API & PostgreSQL Integration
 */

export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // When running in a browser on localhost / 127.0.0.1, prioritize local API
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5000/api/v1";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "https://l19idchgw6.execute-api.ap-southeast-2.amazonaws.com/api/v1";
};

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: Array<{ field: string; message: string }>;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  statusCode: number;
  details?: Array<{ field: string; message: string }>;

  constructor(message: string, statusCode: number, details?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Retrieve auth token from browser localStorage (support both greenledger_auth_token and greenledger_jwt)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("greenledger_auth_token") || localStorage.getItem("greenledger_jwt");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      error: `Server returned ${response.status} ${response.statusText}`,
    }));

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        // Clear invalid/expired session tokens
        localStorage.removeItem("greenledger_auth_token");
        localStorage.removeItem("greenledger_jwt");
        localStorage.removeItem("greenledger_user");
        localStorage.removeItem("user");
      }

      // Auto-recover on 403 role mismatch in demo mode
      if (response.status === 403 && typeof window !== "undefined" && typeof data.error === "string") {
        const match = data.error.match(/Requires one of \[([^\]]+)\]/);
        if (match) {
          const allowedRoles = match[1].split(",").map((s) => s.trim());
          const targetRole = allowedRoles[0] as "ADMIN" | "PRODUCER" | "CONSUMER";
          if (targetRole && (targetRole === "ADMIN" || targetRole === "PRODUCER" || targetRole === "CONSUMER")) {
            try {
              const switchRes = await fetch(`${baseUrl}/auth/switch-role`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: targetRole }),
              }).then((r) => r.json());

              if (switchRes && switchRes.success && switchRes.token) {
                localStorage.setItem("greenledger_auth_token", switchRes.token);
                localStorage.setItem("greenledger_jwt", switchRes.token);
                localStorage.setItem("greenledger_user", JSON.stringify(switchRes.user));
                localStorage.setItem("user", JSON.stringify(switchRes.user));

                // Transparently retry original request with the correct token
                const retryHeaders = new Headers(options.headers || {});
                if (!retryHeaders.has("Content-Type") && !(options.body instanceof FormData)) {
                  retryHeaders.set("Content-Type", "application/json");
                }
                retryHeaders.set("Authorization", `Bearer ${switchRes.token}`);

                const retryResponse = await fetch(url, {
                  ...options,
                  headers: retryHeaders,
                });

                const retryData = await retryResponse.json().catch(() => ({
                  success: false,
                  error: `Server returned ${retryResponse.status}`,
                }));

                if (retryResponse.ok) {
                  return retryData;
                }
              }
            } catch (retryErr) {
              console.error("Auto-role recovery retry failed:", retryErr);
            }
          }
        }
      }

      throw new ApiError(data.error || "Request failed", response.status, data.details);
    }

    return data;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error. Please ensure the backend is running.", 503);
  }
}

// -----------------------------------------------------------------------------
// 1. Authentication APIs
// -----------------------------------------------------------------------------
export const authApi = {
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    role: "PRODUCER" | "CONSUMER";
    meterId: string;
    walletAddress?: string;
    phone?: string;
  }) => request<{ user: any; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload: { email: string; password: string }) =>
    request<{ user: any; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  logout: () => request<null>("/auth/logout", { method: "POST" }),

  me: () => request<any>("/auth/me", { method: "GET" }),

  requestNonce: (walletAddress: string) =>
    request<{ nonce: string; walletAddress: string }>("/auth/nonce", {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
    }),

  forgotPassword: (email: string) =>
    request<null>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  switchDemoRole: async (role: "PRODUCER" | "CONSUMER" | "ADMIN") => {
    const baseUrl = getApiBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/auth/switch-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }).then((r) => r.json());

      if (res && res.success && res.token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("greenledger_auth_token", res.token);
          localStorage.setItem("greenledger_jwt", res.token);
          localStorage.setItem("greenledger_user", JSON.stringify(res.user));
          localStorage.setItem("user", JSON.stringify(res.user));
        }
        return { token: res.token, user: res.user };
      }
    } catch (e) {
      console.warn("Fast switch-role failed, attempting credential login fallback:", e);
    }

    const creds = {
      ADMIN: { email: "admin@greenledger.io", password: "Password123!" },
      PRODUCER: { email: "producer.solarfarm@greenledger.io", password: "Password123!" },
      CONSUMER: { email: "consumer.datacenter@ecotech.com", password: "Password123!" },
    }[role];

    try {
      const res = await authApi.login(creds);
      if (res && res.success) {
        const token = (res.data as any)?.token || (res as any)?.token;
        const user = (res.data as any)?.user || (res as any)?.user;
        if (typeof window !== "undefined" && token && user) {
          localStorage.setItem("greenledger_auth_token", token);
          localStorage.setItem("greenledger_jwt", token);
          localStorage.setItem("greenledger_user", JSON.stringify(user));
          localStorage.setItem("user", JSON.stringify(user));
        }
        return { token, user };
      }
    } catch (e) {
      console.error("Demo role switch error:", e);
    }
    return null;
  },
};

// -----------------------------------------------------------------------------
// 2. Producer APIs
// -----------------------------------------------------------------------------
export const producersApi = {
  createListing: (payload: {
    energySource: "SOLAR" | "WIND" | "HYDRO" | "BIOMASS" | "HYBRID";
    totalEnergyKwh: number;
    pricePerKwh: number;
    minPurchaseKwh?: number;
    windowHours?: number;
  }) => request<any>("/producers/listings", { method: "POST", body: JSON.stringify(payload) }),

  getMyListings: () => request<any[]>("/producers/listings", { method: "GET" }),

  getListingById: (id: string | number) => request<any>(`/producers/listings/${id}`, { method: "GET" }),

  updateListing: (
    id: string | number,
    payload: {
      availableEnergyKwh?: number;
      pricePerKwh?: number;
      listingStatus?: string;
      minPurchaseKwh?: number;
    }
  ) => request<any>(`/producers/listings/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  deleteListing: (id: string | number) => request<any>(`/producers/listings/${id}`, { method: "DELETE" }),

  getDashboard: () => request<any>("/producers/dashboard", { method: "GET" }),

  getIncomingRequests: () => request<any[]>("/producers/requests", { method: "GET" }),

  acceptRequest: (id: string | number, message?: string) =>
    request<any>(`/producers/requests/${id}/accept`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  rejectRequest: (id: string | number, reason?: string) =>
    request<any>(`/producers/requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

// -----------------------------------------------------------------------------
// 3. Consumer APIs
// -----------------------------------------------------------------------------
export const consumersApi = {
  createRequest: (payload: {
    listingId?: number;
    requestedEnergyKwh: number;
    priorityWeight?: number;
    maxAcceptablePrice?: number;
    urgencyLevel?: "HIGH" | "NORMAL" | "FLEXIBLE";
    message?: string;
  }) => request<any>("/consumers/requests", { method: "POST", body: JSON.stringify(payload) }),

  getMyRequests: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    source?: string;
    search?: string;
    sortBy?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", params.page.toString());
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.status) q.set("status", params.status);
    if (params?.source) q.set("source", params.source);
    if (params?.search) q.set("search", params.search);
    if (params?.sortBy) q.set("sortBy", params.sortBy);
    return request<any[]>(`/consumers/requests?${q.toString()}`, { method: "GET" });
  },

  getRequestById: (id: string | number) => request<any>(`/consumers/requests/${id}`, { method: "GET" }),

  cancelRequest: (id: string | number) => request<any>(`/consumers/requests/${id}/cancel`, { method: "PATCH" }),

  payAndSettleRequest: (
    id: string | number,
    payload?: { txHash?: string; paymentMethod?: string }
  ) =>
    request<any>(`/consumers/requests/${id}/pay`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    }),

  getMyPurchases: (params?: {
    page?: number;
    limit?: number;
    source?: string;
    search?: string;
    sortBy?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", params.page.toString());
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.source) q.set("source", params.source);
    if (params?.search) q.set("search", params.search);
    if (params?.sortBy) q.set("sortBy", params.sortBy);
    return request<any[]>(`/consumers/purchases?${q.toString()}`, { method: "GET" });
  },

  getCarbonSavings: () => request<any>("/consumers/carbon-savings", { method: "GET" }),

  getMyAllocations: () => request<any[]>("/consumers/allocations", { method: "GET" }),

  getDashboard: () => request<any>("/consumers/dashboard", { method: "GET" }),
};

// -----------------------------------------------------------------------------
// 4. Marketplace APIs
// -----------------------------------------------------------------------------
export const marketplaceApi = {
  getSummary: () => request<any>("/marketplace/summary", { method: "GET" }),

  getListings: (params: {
    page?: number;
    limit?: number;
    energySource?: string;
    minPrice?: number;
    maxPrice?: number;
    minEnergy?: number;
    sortBy?: string;
    search?: string;
  } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, String(val));
      }
    });
    return request<any[]>(`/marketplace/listings?${query.toString()}`, { method: "GET" });
  },

  getListingById: (id: string | number) => request<any>(`/marketplace/listings/${id}`, { method: "GET" }),
};

// -----------------------------------------------------------------------------
// 5. Allocation & Research Algorithm APIs
// -----------------------------------------------------------------------------
export const algorithmsApi = {
  match: (payload: { pricingRule?: "MIDPOINT" | "PRODUCER_ASK" | "CONSUMER_BID"; listingIds?: number[]; requestIds?: number[] } = {}) =>
    request<any>("/algorithms/match", { method: "POST", body: JSON.stringify(payload) }),

  allocate: (payload: {
    algorithm?: "WEIGHTED_PROPORTIONAL" | "PROPORTIONAL" | "FCFS";
    requestIds?: number[];
    listingIds?: number[];
    isSimulation?: boolean;
  } = {}) => request<any>("/algorithms/allocate", { method: "POST", body: JSON.stringify(payload) }),

  getResultById: (id: string | number) => request<any>(`/algorithms/results/${id}`, { method: "GET" }),

  getMetricsById: (id: string | number) => request<any>(`/algorithms/metrics/${id}`, { method: "GET" }),

  getPricing: (params?: { hourOfDay?: number; energySource?: string; persist?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.hourOfDay !== undefined) q.set("hourOfDay", params.hourOfDay.toString());
    if (params?.energySource) q.set("energySource", params.energySource);
    if (params?.persist) q.set("persist", "true");
    return request<any>(`/algorithms/pricing?${q.toString()}`, { method: "GET" });
  },

  getExperiments: () => request<any[]>("/algorithms/experiments", { method: "GET" }),

  runExperiment: (payload: { scenarioId: string; [key: string]: any }) =>
    request<any>("/algorithms/experiments/run", { method: "POST", body: JSON.stringify(payload) }),

  compare: () => request<any>("/algorithms/compare", { method: "GET" }),
};

export const allocationApi = {
  execute: (payload: {
    algorithm?: "WEIGHTED_PROPORTIONAL" | "PROPORTIONAL" | "FCFS";
    requestIds?: number[];
    listingIds?: number[];
  } = {}) => request<any>("/allocation/execute", { method: "POST", body: JSON.stringify(payload) }),

  getResults: () => request<any[]>("/allocation/results", { method: "GET" }),

  getResultById: (id: string | number) => request<any>(`/allocation/results/${id}`, { method: "GET" }),

  compare: () => request<any>("/allocation/compare", { method: "GET" }),
};

// -----------------------------------------------------------------------------
// 6. Dynamic Pricing APIs
// -----------------------------------------------------------------------------
export const pricingApi = {
  getCurrent: (source = "SOLAR") => request<any>(`/pricing/current?source=${source}`, { method: "GET" }),

  calculate: (payload: {
    basePrice?: number;
    supplyKwh: number;
    demandKwh: number;
    minPrice?: number;
    maxPrice?: number;
  }) => request<any>("/pricing/calculate", { method: "POST", body: JSON.stringify(payload) }),

  getHistory: (limit = 20) => request<any[]>(`/pricing/history?limit=${limit}`, { method: "GET" }),
};

// -----------------------------------------------------------------------------
// 7. Energy Transactions APIs
// -----------------------------------------------------------------------------
export const transactionsApi = {
  createTransaction: (payload: {
    listingId: number;
    energyQuantityKwh: number;
    maxPricePerKwh?: number;
  }) => request<any>("/transactions", { method: "POST", body: JSON.stringify(payload) }),

  getTransactions: () => request<any[]>("/transactions", { method: "GET" }),

  getTransactionById: (id: string | number) => request<any>(`/transactions/${id}`, { method: "GET" }),

  getHistory: () => request<any[]>("/transactions/history", { method: "GET" }),
};

// -----------------------------------------------------------------------------
// 8. Carbon & Renewable Energy Certificate APIs
// -----------------------------------------------------------------------------
export const carbonApi = {
  getSummary: () => request<any>("/carbon/summary", { method: "GET" }),
  getMyRecords: () => request<any[]>("/carbon/records", { method: "GET" }),
};

export const certificatesApi = {
  getCertificates: () => request<any[]>("/certificates", { method: "GET" }),
  getCertificateById: (id: string | number) => request<any>(`/certificates/${id}`, { method: "GET" }),
  verifyCertificate: (identifier: string | number) => request<any>(`/certificates/verify/${identifier}`, { method: "GET" }),
  issueCertificate: (transactionId: number) =>
    request<any>("/certificates/issue", { method: "POST", body: JSON.stringify({ transactionId }) }),
};

// -----------------------------------------------------------------------------
// 9. Administrator APIs
// -----------------------------------------------------------------------------
export const adminApi = {
  getDashboard: () => request<any>("/admin/dashboard", { method: "GET" }),

  getUsers: (params: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    });
    return request<any>(`/admin/users?${q.toString()}`, { method: "GET" });
  },

  getUserById: (id: string | number) => request<any>(`/admin/users/${id}`, { method: "GET" }),

  updateUserStatus: (id: string | number, payload: { status: "ACTIVE" | "SUSPENDED" | "INACTIVE"; reason?: string }) =>
    request<any>(`/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) }),

  getListings: (params: {
    search?: string;
    source?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    });
    return request<any>(`/admin/listings?${q.toString()}`, { method: "GET" });
  },

  updateListingStatus: (id: string | number, payload: { status: "ACTIVE" | "SUSPENDED" | "CANCELLED"; reason?: string }) =>
    request<any>(`/admin/listings/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) }),

  getRequests: (params: {
    search?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    });
    return request<any>(`/admin/requests?${q.toString()}`, { method: "GET" });
  },

  getTransactions: (params: {
    search?: string;
    status?: string;
    producerId?: string | number;
    consumerId?: string | number;
    page?: number;
    limit?: number;
  } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    });
    return request<any>(`/admin/transactions?${q.toString()}`, { method: "GET" });
  },

  getSettings: () => request<any>("/admin/settings", { method: "GET" }),

  updateSettings: (payload: { settings?: Record<string, any>; key?: string; value?: any }) =>
    request<any>("/admin/settings", { method: "PUT", body: JSON.stringify(payload) }),

  getActivityLogs: (params: { action?: string; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    });
    return request<any>(`/admin/activity-logs?${q.toString()}`, { method: "GET" });
  },

  getResearchAnalytics: (params?: { scenarioKey?: string }) => {
    const q = new URLSearchParams();
    if (params?.scenarioKey) q.set("scenarioKey", params.scenarioKey);
    return request<any>(`/admin/research-analytics?${q.toString()}`, { method: "GET" });
  },

  exportResearchAnalyticsCsv: () => {
    // Returns full download URL
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/admin/research-analytics/export`;
  },
};

export const blockchainApi = {
  getNetwork: () => request<any>("/blockchain/network", { method: "GET" }),
  getContracts: () => request<any>("/blockchain/contracts", { method: "GET" }),
  getCertificates: () => request<any>("/blockchain/certificates", { method: "GET" }),
  verifyCertificate: (id: string | number) =>
    request<any>(`/blockchain/certificates/${id}/verify`, { method: "GET" }),
  getTransaction: (id: string) => request<any>(`/blockchain/transactions/${id}`, { method: "GET" }),
  prepareTrade: (id: string | number, walletAddress?: string, action?: string) =>
    request<any>(`/blockchain/trades/${id}/prepare`, {
      method: "POST",
      body: JSON.stringify({ walletAddress, action }),
    }),
  confirmTrade: (
    id: string | number,
    payload: { transactionHash: string; contractAddress?: string; networkName?: string; transactionType?: string }
  ) =>
    request<any>(`/blockchain/trades/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  syncEvents: (fromBlock = 0) =>
    request<any>("/blockchain/sync", {
      method: "POST",
      body: JSON.stringify({ fromBlock }),
    }),
};
