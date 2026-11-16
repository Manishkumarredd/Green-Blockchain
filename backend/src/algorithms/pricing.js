/**
 * Rule-Based Dynamic Energy Pricing Engine
 * 
 * Computes suggested clearing and floor/ceiling prices based on explicit rule sets:
 * 1. Time-of-Use (TOU) tariff schedules (Peak, Normal, Off-Peak).
 * 2. Supply-to-Demand Elasticity ratio.
 * 3. Energy source availability factor.
 * 4. Regulatory price caps (safety guardrails).
 * 
 * Strictly deterministic and rule-based (No ML/DL).
 */

const DEFAULT_CONFIG = {
  baseGridTariffEth: 0.00010000,
  minPriceFloorEth: 0.00004000,
  maxPriceCeilingEth: 0.00025000,
  scarcityFactor: 0.25, // Max ±25% swing based on supply-demand imbalance
};

/**
 * Determine Time-of-Use multiplier based on current hour of day
 * @param {number} hour (0 - 23)
 */
function getTimeOfUseMultiplier(hour) {
  if (hour >= 18 && hour <= 22) {
    // Evening peak demand
    return 1.30;
  } else if (hour >= 9 && hour <= 12) {
    // Morning commercial peak
    return 1.15;
  } else if (hour >= 1 && hour <= 5) {
    // Late night low demand trough
    return 0.80;
  }
  // Normal shoulder hours
  return 1.00;
}

/**
 * Calculate dynamic price recommendation
 * @param {object} params
 * @param {number} params.totalSupplyKwh
 * @param {number} params.totalDemandKwh
 * @param {number} [params.hourOfDay]
 * @param {string} [params.energySource]
 * @param {object} [params.customConfig]
 */
function calculateDynamicPrice({
  totalSupplyKwh,
  totalDemandKwh,
  hourOfDay = new Date().getHours(),
  energySource = "SOLAR",
  customConfig = {},
}) {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const supply = Math.max(0.1, Number(totalSupplyKwh || 0.1));
  const demand = Math.max(0.1, Number(totalDemandKwh || 0.1));

  // 1. Time-of-use multiplier
  const touMultiplier = getTimeOfUseMultiplier(hourOfDay);

  // 2. Supply-Demand Balance Ratio: [-1.0, 1.0]
  // positive when demand > supply, negative when supply > demand
  const imbalance = (demand - supply) / (demand + supply);
  const supplyDemandMultiplier = 1.0 + (imbalance * config.scarcityFactor);

  // 3. Source-specific adjustment
  let sourceMultiplier = 1.0;
  if (energySource === "SOLAR" && (hourOfDay >= 11 && hourOfDay <= 15)) {
    // Solar peak production midday discount
    sourceMultiplier = 0.92;
  } else if (energySource === "WIND" && (hourOfDay >= 0 && hourOfDay <= 6)) {
    // High nocturnal wind discount
    sourceMultiplier = 0.90;
  }

  // Calculate unconstrained raw dynamic price
  const rawPrice = config.baseGridTariffEth * touMultiplier * supplyDemandMultiplier * sourceMultiplier;

  // Apply safety clamps
  const clampedPrice = Math.min(
    config.maxPriceCeilingEth,
    Math.max(config.minPriceFloorEth, rawPrice)
  );

  return {
    baseTariffEth: config.baseGridTariffEth,
    recommendedPriceEth: Number(clampedPrice.toFixed(8)),
    touMultiplier,
    supplyDemandRatio: Number((demand / supply).toFixed(2)),
    imbalanceIndex: Number(imbalance.toFixed(2)),
    isPeakHour: touMultiplier > 1.0,
    priceFloorEth: config.minPriceFloorEth,
    priceCeilingEth: config.maxPriceCeilingEth,
  };
}

module.exports = {
  calculateDynamicPrice,
  getTimeOfUseMultiplier,
};
