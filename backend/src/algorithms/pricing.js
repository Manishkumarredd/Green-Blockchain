/**
 * GreenLedger Dynamic Pricing Engine Facade
 * Re-exports the Rule-Based Dynamic Pricing implementation.
 */

const {
  calculateRuleBasedDynamicPrice,
  getTOUMultiplier,
  getTimeOfUseMultiplier,
  DEFAULT_CONFIG,
} = require("./dynamicPricing");

module.exports = {
  calculateDynamicPrice: calculateRuleBasedDynamicPrice,
  calculateRuleBasedDynamicPrice,
  getTimeOfUseMultiplier,
  getTOUMultiplier,
  DEFAULT_CONFIG,
};
