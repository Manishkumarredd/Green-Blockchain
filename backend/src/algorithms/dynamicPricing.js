/**
 * GreenLedger Rule-Based Dynamic Energy Pricing Engine
 * 
 * Computes transparent, bounded dynamic tariffs based on:
 * 1. Supply-Demand Ratio R = Total Energy Demand / Total Available Supply
 * 2. Time-of-Use (TOU) daily demand schedules
 * 3. Renewable energy source availability profiles
 * 4. Regulatory price safety clamps [P_min, P_max]
 * 
 * Strictly deterministic and rule-based (No Machine Learning or AI black-box).
 */

const DEFAULT_CONFIG = {
  referencePriceEth: 0.00010000, // Base tariff reference
  minPriceFloorEth: 0.00005000,  // Minimum regulatory floor
  maxPriceCeilingEth: 0.00020000, // Maximum safety cap (prevents price gouging)
  lowDemandThreshold: 0.50,     // R < 0.50
  highDemandThreshold: 1.00,    // R > 1.00
  lowDemandDiscountPct: 0.10,   // -10% discount during surplus
  highDemandSurchargePct: 0.10, // +10% premium during deficit
};

/**
 * Determine Time-of-Use (TOU) schedule multiplier
 * @param {number} hour Hour of day (0-23)
 */
function getTimeOfUseMultiplier(hour) {
  if (hour >= 18 && hour <= 22) {
    return 1.30; // Evening peak demand
  } else if (hour >= 9 && hour <= 12) {
    return 1.15; // Midday commercial peak
  } else if (hour >= 1 && hour <= 5) {
    return 0.80; // Late night trough
  }
  return 1.00; // Standard shoulder
}

function getTOUMultiplier(hour) {
  const mult = getTimeOfUseMultiplier(hour);
  let label = "Standard Shoulder Hours";
  if (mult === 1.30) {
    label = "Evening Peak Hours (18:00 - 22:00)";
  } else if (mult === 1.15) {
    label = "Midday Commercial Hours (09:00 - 12:00)";
  } else if (mult === 0.80) {
    label = "Nocturnal Off-Peak Hours (01:00 - 05:00)";
  }
  return { multiplier: mult, label };
}

/**
 * Calculate transparent rule-based dynamic price
 * 
 * @param {object} params
 * @param {number} [params.totalAvailableSupplyKwh] Total active renewable generation
 * @param {number} [params.totalSupplyKwh] Alias for totalAvailableSupplyKwh
 * @param {number} params.totalDemandKwh Total active consumer bids
 * @param {number} [params.hourOfDay] 0 - 23
 * @param {string} [params.energySource] SOLAR, WIND, HYDRO, BIOMASS, HYBRID
 * @param {object} [params.customConfig] User-defined threshold overrides
 */
function calculateRuleBasedDynamicPrice(params = {}) {
  const {
    totalDemandKwh = 0,
    hourOfDay = new Date().getHours(),
    energySource = "SOLAR",
    customConfig = {},
  } = params;

  const rawSupply = params.totalAvailableSupplyKwh ?? params.totalSupplyKwh ?? 0;
  const config = { ...DEFAULT_CONFIG, ...customConfig };

  const supply = Math.max(0.001, Number(rawSupply || 0.001));
  const demand = Math.max(0.0, Number(totalDemandKwh || 0.0));

  // 1. Calculate Supply-Demand Ratio R = Demand / Supply
  const ratioR = Number((demand / supply).toFixed(4));

  // 2. Determine Rule-Based Ratio Multiplier and Reason
  let ratioAdjustmentPct = 0.0;
  let ruleReason = "";

  if (ratioR < config.lowDemandThreshold) {
    ratioAdjustmentPct = -config.lowDemandDiscountPct; // -10%
    ruleReason = `Low demand (R = ${ratioR} < ${config.lowDemandThreshold}). Surplus supply triggers a ${(config.lowDemandDiscountPct * 100).toFixed(0)}% green power discount.`;
  } else if (ratioR > config.highDemandThreshold) {
    ratioAdjustmentPct = config.highDemandSurchargePct; // +10%
    ruleReason = `High demand (R = ${ratioR} > ${config.highDemandThreshold}). Demand exceeds available generation; triggers a ${(config.highDemandSurchargePct * 100).toFixed(0)}% grid congestion adjustment.`;
  } else {
    ratioAdjustmentPct = 0.0;
    ruleReason = `Balanced demand (R = ${ratioR} within [${config.lowDemandThreshold}, ${config.highDemandThreshold}]). Baseline reference tariff maintained.`;
  }

  // 3. Time-of-Use Adjustment
  const tou = getTOUMultiplier(hourOfDay);

  // 4. Source-Specific Availability Adjustment
  let sourceMultiplier = 1.0;
  let sourceReason = "Standard generation profile";
  const normSource = (energySource || "").toUpperCase();

  if (normSource === "SOLAR" && hourOfDay >= 11 && hourOfDay <= 15) {
    sourceMultiplier = 0.95; // 5% solar surplus discount during peak daylight
    sourceReason = "Midday solar insolation surplus discount (5%)";
  } else if (normSource === "WIND" && (hourOfDay >= 23 || hourOfDay <= 5)) {
    sourceMultiplier = 0.95; // 5% nocturnal wind discount
    sourceReason = "High nocturnal wind generation discount (5%)";
  }

  // 5. Compute Adjusted Price: P = P_ref * (1 + ratioAdj) * touMultiplier * sourceMultiplier
  const preClampPrice = config.referencePriceEth * (1 + ratioAdjustmentPct) * tou.multiplier * sourceMultiplier;

  // 6. Apply Safety Price Limits [P_min, P_max]
  const finalPrice = Math.min(
    config.maxPriceCeilingEth,
    Math.max(config.minPriceFloorEth, preClampPrice)
  );

  const isClampedHigh = preClampPrice > config.maxPriceCeilingEth;
  const isClampedLow = preClampPrice < config.minPriceFloorEth;

  let clampNotice = "Price is within regulatory tolerance.";
  if (isClampedHigh) {
    clampNotice = `Price capped at maximum regulatory ceiling of ${config.maxPriceCeilingEth.toFixed(8)} ETH to prevent consumer exploitation.`;
  } else if (isClampedLow) {
    clampNotice = `Price protected by minimum regulatory floor of ${config.minPriceFloorEth.toFixed(8)} ETH to guarantee producer viability.`;
  }

  const imbalance = (demand - supply) / (demand + supply);

  return {
    referencePriceEth: config.referencePriceEth,
    baseTariffEth: config.referencePriceEth,
    calculatedPriceEth: Number(finalPrice.toFixed(8)),
    recommendedPriceEth: Number(finalPrice.toFixed(8)),
    supplyDemandRatio: ratioR,
    imbalanceIndex: Number(imbalance.toFixed(2)),
    totalAvailableSupplyKwh: supply,
    totalDemandKwh: demand,
    ratioAdjustmentPct,
    touMultiplier: tou.multiplier,
    touPeriodLabel: tou.label,
    isPeakHour: tou.multiplier > 1.0,
    sourceMultiplier,
    sourceReason,
    ruleReason,
    clampNotice,
    isClamped: isClampedHigh || isClampedLow,
    minPriceFloorEth: config.minPriceFloorEth,
    maxPriceCeilingEth: config.maxPriceCeilingEth,
    formulaSummary: `P = ${config.referencePriceEth} * (1 + ${ratioAdjustmentPct}) * ${tou.multiplier} * ${sourceMultiplier} = ${finalPrice.toFixed(8)} ETH/kWh`,
  };
}

module.exports = {
  calculateRuleBasedDynamicPrice,
  getTOUMultiplier,
  getTimeOfUseMultiplier,
  DEFAULT_CONFIG,
};
