import {
  getDefaultHeatingMMBtu,
  US_STATES_ENERGY,
  type StateEnergyProfile,
} from "@/data/usStatesEnergy";
import {
  calculateEvChargingCosts,
  calculateFullChargeCost,
  calculateHeatPumpVsGasCosts,
  DEFAULT_EV_ASSUMPTIONS,
  DEFAULT_HEAT_PUMP_ASSUMPTIONS,
  type EvChargingResults,
  type HeatPumpResults,
} from "@/lib/calculators";

export interface StateRankedSummary {
  profile: StateEnergyProfile;
  baseline: EvChargingResults;
  fullCharge75Kwh: number;
  electricityRank: number;
  savingsRank: number;
  totalStates: number;
}

const totalStates = US_STATES_ENERGY.length;

const baseEntries = US_STATES_ENERGY.map((profile) => {
  const baseline = calculateEvChargingCosts({
    annualMiles: DEFAULT_EV_ASSUMPTIONS.annualMiles,
    evMilesPerKwh: DEFAULT_EV_ASSUMPTIONS.evMilesPerKwh,
    gasVehicleMpg: DEFAULT_EV_ASSUMPTIONS.gasVehicleMpg,
    electricityCentsPerKwh: profile.electricityCentsPerKwh,
    gasPricePerGallon: profile.gasPricePerGallon,
    publicFastChargeDollarsPerKwh: profile.publicFastChargePerKwh,
    homeChargingSharePercent: DEFAULT_EV_ASSUMPTIONS.homeChargingSharePercent,
    chargingEfficiencyPercent: DEFAULT_EV_ASSUMPTIONS.chargingEfficiencyPercent,
  });

  const fullCharge75Kwh = calculateFullChargeCost(
    DEFAULT_EV_ASSUMPTIONS.batteryKwh,
    profile.electricityCentsPerKwh,
    DEFAULT_EV_ASSUMPTIONS.chargingEfficiencyPercent
  );

  return { profile, baseline, fullCharge75Kwh };
});

const electricityRankMap = new Map<string, number>();
[...baseEntries]
  .sort(
    (a, b) =>
      a.profile.electricityCentsPerKwh - b.profile.electricityCentsPerKwh ||
      a.profile.name.localeCompare(b.profile.name)
  )
  .forEach((entry, idx) => {
    electricityRankMap.set(entry.profile.slug, idx + 1);
  });

const savingsRankMap = new Map<string, number>();
[...baseEntries]
  .sort(
    (a, b) =>
      b.baseline.annualSavingsVsGas - a.baseline.annualSavingsVsGas ||
      a.profile.name.localeCompare(b.profile.name)
  )
  .forEach((entry, idx) => {
    savingsRankMap.set(entry.profile.slug, idx + 1);
  });

export const ALL_STATES_RANKED: StateRankedSummary[] = [...baseEntries]
  .sort((a, b) => a.profile.name.localeCompare(b.profile.name))
  .map((entry) => ({
    ...entry,
    electricityRank: electricityRankMap.get(entry.profile.slug) ?? totalStates,
    savingsRank: savingsRankMap.get(entry.profile.slug) ?? totalStates,
    totalStates,
  }));

export function getStateRankingBySlug(slug: string): StateRankedSummary | undefined {
  return ALL_STATES_RANKED.find((item) => item.profile.slug === slug);
}

export function getCheapestElectricityStates(limit = 5): StateRankedSummary[] {
  return [...ALL_STATES_RANKED]
    .sort((a, b) => a.electricityRank - b.electricityRank)
    .slice(0, limit);
}

export function getMostExpensiveElectricityStates(limit = 5): StateRankedSummary[] {
  return [...ALL_STATES_RANKED]
    .sort((a, b) => b.electricityRank - a.electricityRank)
    .slice(0, limit);
}

export function getTopEvSavingsStates(limit = 5): StateRankedSummary[] {
  return [...ALL_STATES_RANKED]
    .sort((a, b) => a.savingsRank - b.savingsRank)
    .slice(0, limit);
}

export interface StateHeatPumpRankedSummary {
  profile: StateEnergyProfile;
  baseline: HeatPumpResults;
  heatingMMBtu: number;
  heatPumpSavingsRank: number;
  resistanceSavingsRank: number;
  totalStates: number;
}

const heatPumpBaseEntries = US_STATES_ENERGY.map((profile) => {
  const heatingMMBtu = getDefaultHeatingMMBtu(profile.climateZone);
  const baseline = calculateHeatPumpVsGasCosts({
    annualHeatingMMBtu: heatingMMBtu,
    electricityCentsPerKwh: profile.electricityCentsPerKwh,
    naturalGasDollarsPerTherm: profile.naturalGasPerTherm,
    heatPumpHspf2: DEFAULT_HEAT_PUMP_ASSUMPTIONS.heatPumpHspf2,
    furnaceAfuePercent: DEFAULT_HEAT_PUMP_ASSUMPTIONS.furnaceAfuePercent,
  });

  return { profile, baseline, heatingMMBtu };
});

const hpGasSavingsRankMap = new Map<string, number>();
[...heatPumpBaseEntries]
  .sort(
    (a, b) =>
      b.baseline.annualSavingsVsGas - a.baseline.annualSavingsVsGas ||
      a.profile.name.localeCompare(b.profile.name)
  )
  .forEach((entry, idx) => {
    hpGasSavingsRankMap.set(entry.profile.slug, idx + 1);
  });

const hpResistanceSavingsRankMap = new Map<string, number>();
[...heatPumpBaseEntries]
  .sort(
    (a, b) =>
      b.baseline.annualSavingsVsResistance - a.baseline.annualSavingsVsResistance ||
      a.profile.name.localeCompare(b.profile.name)
  )
  .forEach((entry, idx) => {
    hpResistanceSavingsRankMap.set(entry.profile.slug, idx + 1);
  });

export const ALL_STATES_HEAT_PUMP_RANKED: StateHeatPumpRankedSummary[] = [
  ...heatPumpBaseEntries,
]
  .sort((a, b) => a.profile.name.localeCompare(b.profile.name))
  .map((entry) => ({
    ...entry,
    heatPumpSavingsRank: hpGasSavingsRankMap.get(entry.profile.slug) ?? totalStates,
    resistanceSavingsRank: hpResistanceSavingsRankMap.get(entry.profile.slug) ?? totalStates,
    totalStates,
  }));

export function getStateHeatPumpRankingBySlug(
  slug: string
): StateHeatPumpRankedSummary | undefined {
  return ALL_STATES_HEAT_PUMP_RANKED.find((item) => item.profile.slug === slug);
}

export function getTopHeatPumpSavingsStates(limit = 5): StateHeatPumpRankedSummary[] {
  return [...ALL_STATES_HEAT_PUMP_RANKED]
    .sort((a, b) => a.heatPumpSavingsRank - b.heatPumpSavingsRank)
    .slice(0, limit);
}

export function getTopResistanceSavingsStates(limit = 5): StateHeatPumpRankedSummary[] {
  return [...ALL_STATES_HEAT_PUMP_RANKED]
    .sort((a, b) => a.resistanceSavingsRank - b.resistanceSavingsRank)
    .slice(0, limit);
}

