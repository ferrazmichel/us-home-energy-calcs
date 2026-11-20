import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateChargingSessions,
  calculateEvChargingCosts,
  calculateFullChargeCost,
  DEFAULT_EV_ASSUMPTIONS,
  EV_PRESETS,
  formatUsd,
  GAS_PRESETS,
} from "../src/lib/calculators.ts";
import {
  getClimateEvNote,
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

