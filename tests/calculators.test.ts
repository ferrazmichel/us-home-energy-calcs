import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateChargingSessions,
  calculateEvChargingCosts,
  calculateFullChargeCost,
  calculateHeatPumpVsGasCosts,
  calculateSolarPayback,
  DEFAULT_EV_ASSUMPTIONS,
  DEFAULT_HEAT_PUMP_ASSUMPTIONS,
  DEFAULT_SOLAR_ASSUMPTIONS,
  EV_PRESETS,
  formatUsd,
  FURNACE_PRESETS,
  GAS_PRESETS,
  HEAT_PUMP_PRESETS,
  SOLAR_INCENTIVE_PRESETS,
  SOLAR_SIZE_PRESETS,
} from "../src/lib/calculators.ts";
import {
  getClimateEvNote,
  getClimateHeatPumpNote,
  getClimateSolarNote,
  getDefaultHeatingMMBtu,
  getRelatedStates,
  getStateBySlug,
  US_NATIONAL_AVERAGE,
  US_STATES_ENERGY,
} from "../src/data/usStatesEnergy.ts";

test("dataset contains all 50 US states plus Washington DC with valid values", () => {
  assert.equal(US_STATES_ENERGY.length, 51);

  const slugs = new Set(US_STATES_ENERGY.map((s) => s.slug));
  const abbrs = new Set(US_STATES_ENERGY.map((s) => s.abbr));
  assert.equal(slugs.size, 51);
  assert.equal(abbrs.size, 51);

  for (const state of US_STATES_ENERGY) {
    assert.ok(state.name.length > 0);
    assert.equal(state.abbr.length, 2);
    assert.ok(Number.isFinite(state.electricityCentsPerKwh) && state.electricityCentsPerKwh > 0);
    assert.ok(Number.isFinite(state.gasPricePerGallon) && state.gasPricePerGallon > 0);
    assert.ok(Number.isFinite(state.naturalGasPerTherm) && state.naturalGasPerTherm > 0);
    assert.ok(Number.isFinite(state.publicFastChargePerKwh) && state.publicFastChargePerKwh > 0);
    assert.ok(Number.isFinite(state.peakSunHours) && state.peakSunHours > 0);
    assert.ok(state.usAvgComparisonNote.length > 10);
  }

  assert.equal(getStateBySlug("california")?.abbr, "CA");
  assert.equal(getStateBySlug("district-of-columbia")?.abbr, "DC");
  assert.equal(getStateBySlug("non-existent"), undefined);
});

test("calculateEvChargingCosts computes accurate 90%-efficiency home vs blended vs gas costs", () => {
  const res = calculateEvChargingCosts({
    annualMiles: 13500,
    evMilesPerKwh: 3.4,
    gasVehicleMpg: 28,
    electricityCentsPerKwh: US_NATIONAL_AVERAGE.electricityCentsPerKwh,
    gasPricePerGallon: US_NATIONAL_AVERAGE.gasPricePerGallon,
    publicFastChargeDollarsPerKwh: US_NATIONAL_AVERAGE.publicFastChargePerKwh,
    homeChargingSharePercent: 85,
    chargingEfficiencyPercent: 90,
  });

  const expectedKwh = 13500 / 3.4 / 0.9;
  const expectedPureHome = expectedKwh * 0.164;
  const expectedPurePublic = expectedKwh * 0.44;
  const expectedBlended = expectedPureHome * 0.85 + expectedPurePublic * 0.15;
  const expectedGas = (13500 / 28) * 3.25;

  assert.ok(Math.abs(res.annualKwhConsumed - expectedKwh) < 1e-6);
  assert.ok(Math.abs(res.annualPureHomeEvCost - expectedPureHome) < 1e-6);
  assert.ok(Math.abs(res.annualPurePublicEvCost - expectedPurePublic) < 1e-6);
  assert.ok(Math.abs(res.annualBlendedEvCost - expectedBlended) < 1e-6);
  assert.ok(Math.abs(res.annualGasCost - expectedGas) < 1e-6);
  assert.ok(Math.abs(res.annualSavingsVsGas - (expectedGas - expectedBlended)) < 1e-6);
  assert.ok(Math.abs(res.fiveYearSavingsVsGas - res.annualSavingsVsGas * 5) < 1e-6);
  assert.ok(Math.abs(res.monthlyPureHomeEvCost - expectedPureHome / 12) < 1e-6);
  assert.ok(Math.abs(res.monthlyBlendedEvCost - expectedBlended / 12) < 1e-6);
  assert.ok(Math.abs(res.monthlyGasCost - expectedGas / 12) < 1e-6);
  assert.ok(Math.abs(res.costPer100MilesHome - (expectedPureHome / 13500) * 100) < 1e-6);
  assert.ok(Math.abs(res.costPer100MilesEv - (expectedBlended / 13500) * 100) < 1e-6);
  assert.ok(Math.abs(res.costPer100MilesPublic - (expectedPurePublic / 13500) * 100) < 1e-6);
});

test("calculateEvChargingCosts handles 100% home, 0% home, negative savings, and zero-mile edge case", () => {
  const allHome = calculateEvChargingCosts({
    annualMiles: 10000,
    evMilesPerKwh: 4.0,
    gasVehicleMpg: 25,
    electricityCentsPerKwh: 15,
    gasPricePerGallon: 3.5,
    publicFastChargeDollarsPerKwh: 0.5,
    homeChargingSharePercent: 100,
  });
  assert.ok(Math.abs(allHome.annualBlendedEvCost - allHome.annualPureHomeEvCost) < 1e-6);
  assert.ok(Math.abs(allHome.costPer100MilesEv - allHome.costPer100MilesHome) < 1e-6);

  const allPublic = calculateEvChargingCosts({
    annualMiles: 10000,
    evMilesPerKwh: 4.0,
    gasVehicleMpg: 25,
    electricityCentsPerKwh: 15,
    gasPricePerGallon: 3.5,
    publicFastChargeDollarsPerKwh: 0.5,
    homeChargingSharePercent: 0,
  });
  assert.ok(Math.abs(allPublic.annualBlendedEvCost - allPublic.annualPurePublicEvCost) < 1e-6);
  assert.ok(Math.abs(allPublic.costPer100MilesEv - allPublic.costPer100MilesPublic) < 1e-6);

  const negativeSavings = calculateEvChargingCosts({
    annualMiles: 12000,
    evMilesPerKwh: 2.2,
    gasVehicleMpg: 48,
    electricityCentsPerKwh: 42,
    gasPricePerGallon: 2.8,
    publicFastChargeDollarsPerKwh: 0.6,
    homeChargingSharePercent: 85,
  });
  assert.ok(negativeSavings.annualSavingsVsGas < 0);
  assert.ok(negativeSavings.monthlySavingsVsGas < 0);
  assert.ok(negativeSavings.fiveYearSavingsVsGas < 0);

  const zeroMiles = calculateEvChargingCosts({
    annualMiles: 0,
    evMilesPerKwh: 3.4,
    gasVehicleMpg: 28,
    electricityCentsPerKwh: 16,
    gasPricePerGallon: 3.2,
    publicFastChargeDollarsPerKwh: 0.44,
    homeChargingSharePercent: 85,
  });
  assert.equal(zeroMiles.annualKwhConsumed, 0);
  assert.equal(zeroMiles.costPer100MilesEv, 0);
  assert.equal(zeroMiles.costPer100MilesHome, 0);
  assert.equal(zeroMiles.costPer100MilesGas, 0);
  assert.ok(Number.isFinite(zeroMiles.equivalentGasPriceDollarsPerGallon));
});

test("calculateFullChargeCost, calculateChargingSessions, presets, and state helpers work as expected", () => {
  const full75 = calculateFullChargeCost(75, 16.4, 90);
  assert.ok(Math.abs(full75 - (75 / 0.9) * 0.164) < 1e-6);

  const sessions = calculateChargingSessions(15.0, 90);
  assert.equal(sessions.length, 3);
  assert.equal(sessions[0].powerKw, 1.4);
  assert.equal(sessions[1].powerKw, 7.6);
  assert.equal(sessions[2].powerKw, 11.5);
  assert.ok(sessions[0].topUpHours > sessions[1].topUpHours);
  assert.ok(sessions[1].topUpHours > sessions[2].topUpHours);
  assert.ok(Math.abs(sessions[0].topUpCostUsd - (45 / 0.9) * 0.15) < 1e-6);

  assert.equal(formatUsd(1234.56, 2), "$1,234.56");
  assert.equal(formatUsd(1234.56, 0), "$1,235");

  assert.equal(DEFAULT_EV_ASSUMPTIONS.annualMiles, 13500);
  assert.ok(EV_PRESETS.length >= 4);
  assert.ok(GAS_PRESETS.length >= 3);

  const ca = getStateBySlug("california");
  assert.ok(ca);
  const related = getRelatedStates(ca, 6);
  assert.equal(related.length, 6);
  assert.ok(related.every((r) => r.region === "West" && r.slug !== "california"));

  assert.ok(getClimateEvNote("cold").includes("winter"));
  assert.ok(getClimateEvNote("hot").includes("solar"));
  assert.ok(getClimateEvNote("mixed").includes("Four-season"));
});

test("calculateHeatPumpVsGasCosts computes accurate energy, resistance savings, and break-even COP", () => {
  const res = calculateHeatPumpVsGasCosts({
    annualHeatingMMBtu: 38,
    electricityCentsPerKwh: US_NATIONAL_AVERAGE.electricityCentsPerKwh,
    naturalGasDollarsPerTherm: US_NATIONAL_AVERAGE.naturalGasPerTherm,
    heatPumpHspf2: DEFAULT_HEAT_PUMP_ASSUMPTIONS.heatPumpHspf2,
    furnaceAfuePercent: DEFAULT_HEAT_PUMP_ASSUMPTIONS.furnaceAfuePercent,
  });

  const expectedHpKwh = (38 * 1_000_000) / (9.5 * 1000);
  const expectedHpCost = expectedHpKwh * 0.164;
  const expectedTherms = (38 * 1_000_000) / 0.85 / 100_000;
  const expectedGasCost = expectedTherms * 1.48;
  const expectedResKwh = (38 * 1_000_000) / 3412;
  const expectedResCost = expectedResKwh * 0.164;
  const expectedBreakEvenHspf2 = (100 * 0.164 * 0.85) / 1.48;

  assert.ok(Math.abs(res.heatPumpKwhConsumed - expectedHpKwh) < 1e-6);
  assert.ok(Math.abs(res.annualHeatPumpCost - expectedHpCost) < 1e-6);
  assert.ok(Math.abs(res.gasThermsConsumed - expectedTherms) < 1e-6);
  assert.ok(Math.abs(res.annualGasFurnaceCost - expectedGasCost) < 1e-6);
  assert.ok(Math.abs(res.annualElectricResistanceCost - expectedResCost) < 1e-6);
  assert.ok(Math.abs(res.annualSavingsVsGas - (expectedGasCost - expectedHpCost)) < 1e-6);
  assert.ok(Math.abs(res.annualSavingsVsResistance - (expectedResCost - expectedHpCost)) < 1e-6);
  assert.ok(Math.abs(res.breakEvenHspf2 - expectedBreakEvenHspf2) < 1e-6);
  assert.ok(Math.abs(res.breakEvenCop - expectedBreakEvenHspf2 / 3.412) < 1e-6);
  assert.ok(res.annualSavingsVsResistance > 0);
});

test("heat pump presets, climate defaults, and 51-state runs handle edge cases cleanly", () => {
  assert.equal(getDefaultHeatingMMBtu("cold"), 60);
  assert.equal(getDefaultHeatingMMBtu("mixed"), 38);
  assert.equal(getDefaultHeatingMMBtu("hot"), 18);

  assert.ok(getClimateHeatPumpNote("cold").includes("COP"));
  assert.ok(getClimateHeatPumpNote("hot").includes("SEER2"));
  assert.ok(getClimateHeatPumpNote("mixed").includes("Mixed-climate"));

  assert.ok(HEAT_PUMP_PRESETS.length >= 3);
  assert.ok(FURNACE_PRESETS.length >= 3);

  for (const state of US_STATES_ENERGY) {
    const res = calculateHeatPumpVsGasCosts({
      annualHeatingMMBtu: getDefaultHeatingMMBtu(state.climateZone),
      electricityCentsPerKwh: state.electricityCentsPerKwh,
      naturalGasDollarsPerTherm: state.naturalGasPerTherm,
      heatPumpHspf2: DEFAULT_HEAT_PUMP_ASSUMPTIONS.heatPumpHspf2,
      furnaceAfuePercent: DEFAULT_HEAT_PUMP_ASSUMPTIONS.furnaceAfuePercent,
    });
    assert.ok(Number.isFinite(res.annualHeatPumpCost) && res.annualHeatPumpCost > 0);
    assert.ok(Number.isFinite(res.annualGasFurnaceCost) && res.annualGasFurnaceCost > 0);
    assert.ok(res.annualSavingsVsResistance > 0);
    assert.ok(Number.isFinite(res.breakEvenCop) && res.breakEvenCop > 0);
  }

  const zeroLoad = calculateHeatPumpVsGasCosts({
    annualHeatingMMBtu: 0,
    electricityCentsPerKwh: 16,
    naturalGasDollarsPerTherm: 1.5,
    heatPumpHspf2: 9.5,
    furnaceAfuePercent: 85,
  });
  assert.equal(zeroLoad.annualHeatPumpCost, 0);
  assert.equal(zeroLoad.annualGasFurnaceCost, 0);
  assert.ok(Number.isFinite(zeroLoad.costPerMMBtuHeatPump) && zeroLoad.costPerMMBtuHeatPump > 0);
  assert.ok(Number.isFinite(zeroLoad.costPerMMBtuGas) && zeroLoad.costPerMMBtuGas > 0);
});

test("calculateSolarPayback computes accurate PV output, payback years, 25-year profit, and LCOE", () => {
  const res = calculateSolarPayback({
    systemSizeKw: DEFAULT_SOLAR_ASSUMPTIONS.systemSizeKw,
    electricityCentsPerKwh: US_NATIONAL_AVERAGE.electricityCentsPerKwh,
    peakSunHours: US_NATIONAL_AVERAGE.peakSunHours,
    monthlyElectricBillUsd: DEFAULT_SOLAR_ASSUMPTIONS.monthlyElectricBillUsd,
    installCostPerWattUsd: DEFAULT_SOLAR_ASSUMPTIONS.installCostPerWattUsd,
    incentivePercent: 30,
    performanceRatio: 0.8,
  });

  const expectedAnnualKwh = 8.0 * US_NATIONAL_AVERAGE.peakSunHours * 365 * 0.8;
  const expectedGross = 8.0 * 1000 * 2.85;
  const expectedNet = expectedGross * 0.7;
  const expectedYear1Savings = expectedAnnualKwh * 0.164;
  const expectedPayback = expectedNet / expectedYear1Savings;

  assert.ok(Math.abs(res.annualProductionKwh - expectedAnnualKwh) < 1e-6);
  assert.ok(Math.abs(res.grossSystemCostUsd - expectedGross) < 1e-6);
  assert.ok(Math.abs(res.netSystemCostUsd - expectedNet) < 1e-6);
  assert.ok(Math.abs(res.firstYearSavingsUsd - expectedYear1Savings) < 1e-6);
  assert.ok(Math.abs(res.simplePaybackYears - expectedPayback) < 1e-6);
  assert.ok(res.twentyFiveYearGrossSavingsUsd > res.firstYearSavingsUsd * 25);
  assert.ok(res.twentyFiveYearNetProfitUsd > 0);
  assert.ok(res.levelizedSolarCentsPerKwh > 0 && res.levelizedSolarCentsPerKwh < 16.4);
});

test("solar presets, climate notes, 51-state runs, and zero-kW edge case work cleanly", () => {
  assert.ok(SOLAR_SIZE_PRESETS.length >= 3);
  assert.ok(SOLAR_INCENTIVE_PRESETS.length >= 3);
  assert.ok(getClimateSolarNote("cold").includes("voltage"));
  assert.ok(getClimateSolarNote("hot").includes("peak sun"));
  assert.ok(getClimateSolarNote("mixed").includes("Moderate"));

  for (const state of US_STATES_ENERGY) {
    const res = calculateSolarPayback({
      systemSizeKw: DEFAULT_SOLAR_ASSUMPTIONS.systemSizeKw,
      electricityCentsPerKwh: state.electricityCentsPerKwh,
      peakSunHours: state.peakSunHours,
      monthlyElectricBillUsd: DEFAULT_SOLAR_ASSUMPTIONS.monthlyElectricBillUsd,
      installCostPerWattUsd: DEFAULT_SOLAR_ASSUMPTIONS.installCostPerWattUsd,
      incentivePercent: DEFAULT_SOLAR_ASSUMPTIONS.incentivePercent,
    });
    assert.ok(Number.isFinite(res.annualProductionKwh) && res.annualProductionKwh > 0);
    assert.ok(Number.isFinite(res.simplePaybackYears) && res.simplePaybackYears > 0);
    assert.ok(Number.isFinite(res.twentyFiveYearNetProfitUsd));
  }

  const zeroSystem = calculateSolarPayback({
    systemSizeKw: 0,
    electricityCentsPerKwh: 16.4,
    peakSunHours: 4.7,
    monthlyElectricBillUsd: 180,
    installCostPerWattUsd: 2.85,
    incentivePercent: 0,
  });
  assert.equal(zeroSystem.annualProductionKwh, 0);
  assert.equal(zeroSystem.simplePaybackYears, 0);
  assert.equal(zeroSystem.levelizedSolarCentsPerKwh, 0);
});

