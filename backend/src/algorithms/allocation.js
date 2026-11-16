/**
 * GreenLedger Allocation Algorithm Facade
 * Re-exports the unified Demand-Aware Weighted Proportional Allocation and baselines.
 */

const {
  allocateDemandAwareWeightedProportional,
  allocateFCFS,
  allocateBasicProportional,
  allocateProportionally,
} = require("./allocationAlgorithm");

module.exports = {
  allocateDemandAwareWeightedProportional,
  allocateProportionally,
  allocateFCFS,
  allocateBasicProportional,
};
