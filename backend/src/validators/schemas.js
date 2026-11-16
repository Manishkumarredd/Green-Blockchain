const { z } = require("zod");

// 1. Auth Schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z.enum(["PRODUCER", "CONSUMER"], {
    errorMap: () => ({ message: "Role must be either PRODUCER or CONSUMER" }),
  }),
  meterId: z.string().min(3, "Meter ID must be at least 3 characters"),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum wallet address format")
    .optional(),
  phone: z.string().optional(),
}).refine((data) => data.fullName || data.name, {
  message: "Full name is required",
  path: ["fullName"],
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// 2. Producer Schemas
const createListingSchema = z.object({
  energySource: z.enum(["SOLAR", "WIND", "HYDRO", "BIOMASS", "HYBRID"], {
    errorMap: () => ({ message: "Energy source must be SOLAR, WIND, HYDRO, BIOMASS, or HYBRID" }),
  }),
  totalEnergyKwh: z.number().positive("Total energy must be greater than 0"),
  pricePerKwh: z.number().positive("Price per kWh must be greater than 0"),
  minPurchaseKwh: z.number().positive("Min purchase must be positive").default(1.0),
  windowHours: z.number().positive().default(24),
});

const updateListingSchema = z.object({
  availableEnergyKwh: z.number().nonnegative("Available energy cannot be negative").optional(),
  pricePerKwh: z.number().positive("Price per kWh must be greater than 0").optional(),
  listingStatus: z.enum(["ACTIVE", "PARTIALLY_FILLED", "FILLED", "CANCELLED", "EXPIRED"]).optional(),
  minPurchaseKwh: z.number().positive().optional(),
});

// 3. Consumer Schemas
const createRequestSchema = z.object({
  listingId: z.number().int().positive().optional(),
  requestedEnergyKwh: z.number().positive("Requested energy must be greater than 0"),
  priorityWeight: z.number().min(1.0, "Priority weight must be at least 1.0").default(1.0),
  maxAcceptablePrice: z.number().positive("Max acceptable price must be greater than 0").optional(),
  urgencyLevel: z.enum(["HIGH", "NORMAL", "FLEXIBLE"]).default("NORMAL"),
  message: z.string().max(500).optional(),
});

const updateRequestSchema = z.object({
  requestedEnergyKwh: z.number().positive().optional(),
  maxAcceptablePrice: z.number().positive().optional(),
  requestStatus: z.enum(["PENDING", "MATCHED", "PARTIALLY_MATCHED", "FULFILLED", "CANCELLED", "REJECTED"]).optional(),
});

// 4. Marketplace Query Schema
const queryMarketplaceSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  energySource: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minEnergy: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "quantity_asc", "quantity_desc", "created_desc"]).default("price_asc"),
  search: z.string().optional(),
});

// 5. Dynamic Pricing Schema
const calculatePricingSchema = z.object({
  basePrice: z.number().positive().default(0.00012),
  supplyKwh: z.number().nonnegative("Supply cannot be negative"),
  demandKwh: z.number().nonnegative("Demand cannot be negative"),
  minPrice: z.number().positive().default(0.00007),
  maxPrice: z.number().positive().default(0.00018),
});

// 6. Allocation Schema
const executeAllocationSchema = z.object({
  algorithm: z.enum(["WEIGHTED_PROPORTIONAL", "PROPORTIONAL", "FCFS"]).default("WEIGHTED_PROPORTIONAL"),
  requestIds: z.array(z.number().int()).optional(),
  listingIds: z.array(z.number().int()).optional(),
});

// 7. Transaction Schemas
const createTransactionSchema = z.object({
  listingId: z.number().int().positive("Valid listing ID required"),
  energyQuantityKwh: z.number().positive("Energy quantity must be greater than 0"),
  maxPricePerKwh: z.number().positive().optional(),
});

// 8. Certificate Schemas
const issueCertificateSchema = z.object({
  transactionId: z.number().int().positive("Valid transaction ID required"),
});

// 9. Admin Settings Schema
const updateSettingSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.string().min(1, "Setting value is required"),
});

module.exports = {
  registerSchema,
  loginSchema,
  createListingSchema,
  updateListingSchema,
  createRequestSchema,
  updateRequestSchema,
  queryMarketplaceSchema,
  calculatePricingSchema,
  executeAllocationSchema,
  createTransactionSchema,
  issueCertificateSchema,
  updateSettingSchema,
};
