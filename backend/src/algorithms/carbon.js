/**
 * Carbon Savings Estimation Engine
 * 
 * Computes verified carbon offset and greenhouse gas (GHG) reductions
 * by comparing traded clean renewable energy against fossil-dominated grid baselines.
 * 
 * Baselines (kg CO2-eq per kWh):
 * - Regional Thermal Grid Mix: ~0.820 kg/kWh
 * - Solar PV Lifecycle: ~0.041 kg/kWh
 * - Wind Turbines: ~0.011 kg/kWh
 * - Hydroelectric: ~0.024 kg/kWh
 * - Biomass: ~0.230 kg/kWh
 * 
 * Strictly deterministic and rule-based (No ML/DL).
 */

const GRID_BASELINE_KG_PER_KWH = 0.820;

const RENEWABLE_FACTORS = {
  SOLAR: 0.041,
  WIND: 0.011,
  HYDRO: 0.024,
  BIOMASS: 0.230,
  DEFAULT: 0.030,
};

/**
 * Calculate avoided carbon emissions
 * @param {number} energyAmountKwh
 * @param {string} energySource ("SOLAR", "WIND", "HYDRO", etc.)
 * @param {number} [gridBaseline] custom grid baseline factor
 */
function calculateCarbonSavings(energyAmountKwh, energySource = "SOLAR", gridBaseline = GRID_BASELINE_KG_PER_KWH) {
  const kwh = Math.max(0, Number(energyAmountKwh || 0));
  const sourceFactor = RENEWABLE_FACTORS[energySource.toUpperCase()] || RENEWABLE_FACTORS.DEFAULT;

  const netAvoidedFactor = Math.max(0, gridBaseline - sourceFactor);
  const carbonSavedKg = kwh * netAvoidedFactor;
  const carbonSavedGrams = carbonSavedKg * 1000;

  // Real-world tangible environmental equivalencies:
  // - 1 mature tree absorbs ~21.77 kg CO2 per year (~0.0596 kg/day)
  // - 1 liter of gasoline combustion ~2.31 kg CO2
  // - Average combustion vehicle emits ~0.120 kg CO2 / km
  const treesPlantedEquivalentYear = carbonSavedKg / 21.77;
  const gasolineLitersAvoided = carbonSavedKg / 2.31;
  const carKmAvoided = carbonSavedKg / 0.120;

  return {
    energyAmountKwh: Number(kwh.toFixed(2)),
    energySource: energySource.toUpperCase(),
    gridBaselineKgPerKwh: gridBaseline,
    sourceFactorKgPerKwh: sourceFactor,
    carbonSavedKg: Number(carbonSavedKg.toFixed(2)),
    carbonSavedGrams: Math.round(carbonSavedGrams),
    equivalencies: {
      treesPlantedEquivalentYear: Number(treesPlantedEquivalentYear.toFixed(2)),
      gasolineLitersAvoided: Number(gasolineLitersAvoided.toFixed(2)),
      carKmAvoided: Number(carKmAvoided.toFixed(2)),
    },
  };
}

module.exports = {
  calculateCarbonSavings,
  GRID_BASELINE_KG_PER_KWH,
  RENEWABLE_FACTORS,
};
