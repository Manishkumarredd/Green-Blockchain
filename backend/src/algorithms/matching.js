/**
 * GreenLedger Energy Matching Engine Facade
 * Re-exports the Price-Aware Greedy Matching implementation.
 */

const { matchOrdersGreedy } = require("./greedyMatching");

module.exports = {
  matchOrdersGreedy,
};
