/**
 * Renewable Energy Simulation Engine
 * 
 * Entirely software-based mathematical simulation of renewable energy generation:
 * 1. Solar PV Simulation: Bell-curve solar irradiance based on hour of day, panel efficiency, ambient temperature.
 * 2. Wind Turbine Simulation: Aerodynamic power curve (cut-in 3 m/s, rated 12 m/s, cut-out 25 m/s).
 * 3. Hydro Generation: Stable continuous head and volumetric discharge rate.
 * 
 * Strictly deterministic and mathematical (No ML/DL, No IoT hardware).
 */

class EnergySimulator {
  /**
   * Simulate Solar Power Generation (in kWh per hour)
   * @param {number} capacityKw Rated capacity of solar array in kW
   * @param {number} hourOfDay 0 - 23
   * @param {number} cloudCoverRatio 0.0 (clear sky) to 1.0 (overcast)
   * @param {number} tempC Ambient temperature in Celsius
   */
  static simulateSolar(capacityKw, hourOfDay = new Date().getHours(), cloudCoverRatio = 0.15, tempC = 25) {
    if (hourOfDay < 6 || hourOfDay > 18) {
      // Nighttime
      return {
        outputKwh: 0,
        solarIrradianceWm2: 0,
        tempC,
        efficiencyRatio: 0,
      };
    }

    // Solar angle peak at 12:00 (midday)
    const solarNoonOffset = Math.abs(12 - hourOfDay);
    // Peak clear-sky solar irradiance ~ 1000 W/m²
    const theoreticalIrradiance = Math.max(0, 1000 * Math.cos((solarNoonOffset / 6) * (Math.PI / 2)));
    const actualIrradiance = theoreticalIrradiance * (1.0 - (cloudCoverRatio * 0.75));

    // Temperature derating factor: -0.4% per °C above 25°C
    const tempDerating = tempC > 25 ? 1.0 - (tempC - 25) * 0.004 : 1.0;
    const efficiency = 0.19 * tempDerating; // Typical 19% monocrystalline efficiency

    // Generated kWh = capacityKw * (actualIrradiance / 1000) * tempDerating
    const outputKwh = capacityKw * (actualIrradiance / 1000) * tempDerating;

    return {
      outputKwh: Number(Math.max(0, outputKwh).toFixed(2)),
      solarIrradianceWm2: Number(actualIrradiance.toFixed(1)),
      tempC,
      cloudCoverRatio,
    };
  }

  /**
   * Simulate Wind Power Generation (in kWh per hour)
   * @param {number} capacityKw Rated wind turbine capacity
   * @param {number} windSpeedMs Wind speed in meters per second
   */
  static simulateWind(capacityKw, windSpeedMs = 7.5) {
    const cutInSpeed = 3.0;   // m/s
    const ratedSpeed = 12.0;  // m/s
    const cutOutSpeed = 25.0; // m/s

    let outputKwh = 0;

    if (windSpeedMs < cutInSpeed || windSpeedMs >= cutOutSpeed) {
      outputKwh = 0;
    } else if (windSpeedMs >= ratedSpeed) {
      outputKwh = capacityKw;
    } else {
      // Cubic power curve between cut-in and rated speed
      const fraction = (windSpeedMs - cutInSpeed) / (ratedSpeed - cutInSpeed);
      outputKwh = capacityKw * Math.pow(fraction, 3);
    }

    return {
      outputKwh: Number(outputKwh.toFixed(2)),
      windSpeedMs: Number(windSpeedMs.toFixed(2)),
      turbineState: windSpeedMs >= cutOutSpeed ? "STOPPED_HIGH_WIND" : windSpeedMs < cutInSpeed ? "IDLE_LOW_WIND" : "GENERATING",
    };
  }

  /**
   * Simulate Hydroelectric Generation (in kWh per hour)
   * @param {number} capacityKw
   * @param {number} flowRateM3s Flow rate in cubic meters / second
   * @param {number} headM Water head height in meters
   */
  static simulateHydro(capacityKw, flowRateM3s = 4.0, headM = 20.0) {
    // P = rho * g * Q * H * efficiency
    // rho = 1000 kg/m^3, g = 9.81 m/s^2, efficiency ~ 85%
    const theoreticalKw = (1000 * 9.81 * flowRateM3s * headM * 0.85) / 1000;
    const outputKwh = Math.min(capacityKw, theoreticalKw);

    return {
      outputKwh: Number(outputKwh.toFixed(2)),
      flowRateM3s,
      headM,
    };
  }
}

module.exports = EnergySimulator;
