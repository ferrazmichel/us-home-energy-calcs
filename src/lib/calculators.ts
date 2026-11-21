export interface EvChargingInputs {
  annualMiles: number;
  evMilesPerKwh: number;
  gasVehicleMpg: number;
  electricityCentsPerKwh: number;
  gasPricePerGallon: number;
  publicFastChargeDollarsPerKwh: number;
  homeChargingSharePercent: number;
  chargingEfficiencyPercent?: number;
}

export interface EvChargingResults {
  annualKwhConsumed: number;
  annualBlendedEvCost: number;
  annualPureHomeEvCost: number;
  annualPurePublicEvCost: number;
  annualGasCost: number;
  annualSavingsVsGas: number;
  fiveYearSavingsVsGas: number;
  monthlyPureHomeEvCost: number;
  monthlyBlendedEvCost: number;
  monthlyGasCost: number;
  monthlySavingsVsGas: number;
  costPer100MilesEv: number;
  costPer100MilesHome: number;
  costPer100MilesPublic: number;
  costPer100MilesGas: number;
  equivalentGasPriceDollarsPerGallon: number;
}

export interface VehiclePreset {
  label: string;
  efficiency: number;
}

export interface ChargingSessionTier {
  tier: string;
  powerKw: number;
  dailyMiles: number;
  dailyBatteryKwh: number;
  dailyGridKwh: number;
  dailyHours: number;
  dailyCostUsd: number;
  topUpLabel: string;
  topUpBatteryKwh: number;
  topUpGridKwh: number;
  topUpHours: number;
  topUpCostUsd: number;
}

export const DEFAULT_EV_ASSUMPTIONS = {
  annualMiles: 13500,
  evMilesPerKwh: 3.4,
  gasVehicleMpg: 28,
  homeChargingSharePercent: 85,
  chargingEfficiencyPercent: 90,
  batteryKwh: 75,
} as const;

export const EV_PRESETS: readonly VehiclePreset[] = [
  { label: "Tesla Model 3 RWD", efficiency: 4.1 },
  { label: "Tesla Model Y AWD", efficiency: 3.5 },
  { label: "Hyundai Ioniq 5", efficiency: 3.3 },
  { label: "Chevy Equinox EV", efficiency: 3.2 },
  { label: "Ford F-150 Lightning", efficiency: 2.2 },
];

export const GAS_PRESETS: readonly VehiclePreset[] = [
  { label: "Hybrid Sedan", efficiency: 45 },
  { label: "Midsize Sedan", efficiency: 32 },
  { label: "Compact SUV", efficiency: 28 },
  { label: "Full-Size Pickup", efficiency: 20 },
];

function clampFinite(value: number, min: number, max?: number): number {
  if (!Number.isFinite(value)) return min;
  const bounded = Math.max(min, value);
  return max !== undefined ? Math.min(max, bounded) : bounded;
}

/**
 * Pure EV home charging vs. gasoline & public fast-charging cost engine.
 * Accounts for wall-to-battery AC/DC charging losses (default 90% efficiency).
 */
export function calculateEvChargingCosts(inputs: EvChargingInputs): EvChargingResults {
  const miles = clampFinite(inputs.annualMiles, 0);
  const evEff = clampFinite(inputs.evMilesPerKwh, 0.5);
  const gasMpg = clampFinite(inputs.gasVehicleMpg, 1);
  const homeRateDollars = clampFinite(inputs.electricityCentsPerKwh, 0) / 100;
  const publicRateDollars = clampFinite(inputs.publicFastChargeDollarsPerKwh, 0);
  const gasPrice = clampFinite(inputs.gasPricePerGallon, 0);
  const homeShare = clampFinite(inputs.homeChargingSharePercent, 0, 100) / 100;
  const chargerEff =
    clampFinite(
      inputs.chargingEfficiencyPercent ?? DEFAULT_EV_ASSUMPTIONS.chargingEfficiencyPercent,
      60,
      100
    ) / 100;

  const annualKwhConsumed = miles / evEff / chargerEff;
  const annualPureHomeEvCost = annualKwhConsumed * homeRateDollars;
  const annualPurePublicEvCost = annualKwhConsumed * publicRateDollars;
  const annualBlendedEvCost =
    annualPureHomeEvCost * homeShare + annualPurePublicEvCost * (1 - homeShare);

  const annualGallons = miles / gasMpg;
  const annualGasCost = annualGallons * gasPrice;

  const annualSavingsVsGas = annualGasCost - annualBlendedEvCost;
  const fiveYearSavingsVsGas = annualSavingsVsGas * 5;

  const monthlyPureHomeEvCost = annualPureHomeEvCost / 12;
  const monthlyBlendedEvCost = annualBlendedEvCost / 12;
  const monthlyGasCost = annualGasCost / 12;
  const monthlySavingsVsGas = annualSavingsVsGas / 12;

  const costPer100MilesEv = miles > 0 ? (annualBlendedEvCost / miles) * 100 : 0;
  const costPer100MilesHome = miles > 0 ? (annualPureHomeEvCost / miles) * 100 : 0;
  const costPer100MilesPublic = miles > 0 ? (annualPurePublicEvCost / miles) * 100 : 0;
  const costPer100MilesGas = miles > 0 ? (annualGasCost / miles) * 100 : 0;

  const blendedRate = homeRateDollars * homeShare + publicRateDollars * (1 - homeShare);
  const equivalentGasPriceDollarsPerGallon = (blendedRate / (evEff * chargerEff)) * gasMpg;

  return {
    annualKwhConsumed,
    annualBlendedEvCost,
    annualPureHomeEvCost,
    annualPurePublicEvCost,
    annualGasCost,
    annualSavingsVsGas,
    fiveYearSavingsVsGas,
    monthlyPureHomeEvCost,
    monthlyBlendedEvCost,
    monthlyGasCost,
    monthlySavingsVsGas,
    costPer100MilesEv,
    costPer100MilesHome,
    costPer100MilesPublic,
    costPer100MilesGas,
    equivalentGasPriceDollarsPerGallon,
  };
}

/**
 * Total electricity cost at the home meter for a given battery capacity (kWh),
 * factoring in wall-to-battery charging efficiency.
 */
export function calculateFullChargeCost(
  batteryKwh: number,
  electricityCentsPerKwh: number,
  chargingEfficiencyPercent = DEFAULT_EV_ASSUMPTIONS.chargingEfficiencyPercent
): number {
  const capacity = clampFinite(batteryKwh, 0);
  const rateDollars = clampFinite(electricityCentsPerKwh, 0) / 100;
  const eff = clampFinite(chargingEfficiencyPercent, 60, 100) / 100;
  return (capacity / eff) * rateDollars;
}

/**
 * Compare Level 1 (120V) vs. Level 2 (240V) home charging duration and cost
 * for typical daily US driving (~37 mi/day) and a 20%->80% top-up on a 75 kWh pack.
 */
export function calculateChargingSessions(
  electricityCentsPerKwh: number,
  chargingEfficiencyPercent = DEFAULT_EV_ASSUMPTIONS.chargingEfficiencyPercent
): ChargingSessionTier[] {
  const rateDollars = clampFinite(electricityCentsPerKwh, 0) / 100;
  const eff = clampFinite(chargingEfficiencyPercent, 60, 100) / 100;

  const dailyMiles = 37;
  const dailyBatteryKwh = dailyMiles / DEFAULT_EV_ASSUMPTIONS.evMilesPerKwh;
  const dailyGridKwh = dailyBatteryKwh / eff;

  const topUpBatteryKwh = 45; // 20% -> 80% of a 75 kWh pack
  const topUpGridKwh = topUpBatteryKwh / eff;

  const tiers = [
    { tier: "Level 1 — 120V (1.4 kW)", powerKw: 1.4 },
    { tier: "Level 2 — 240V 32A (7.6 kW)", powerKw: 7.6 },
    { tier: "Level 2 — 240V 48A (11.5 kW)", powerKw: 11.5 },
  ];

  return tiers.map(({ tier, powerKw }) => ({
    tier,
    powerKw,
    dailyMiles,
    dailyBatteryKwh,
    dailyGridKwh,
    dailyHours: dailyGridKwh / powerKw,
    dailyCostUsd: dailyGridKwh * rateDollars,
    topUpLabel: "20% → 80% (75 kWh pack)",
    topUpBatteryKwh,
    topUpGridKwh,
    topUpHours: topUpGridKwh / powerKw,
    topUpCostUsd: topUpGridKwh * rateDollars,
  }));
}

export function formatUsd(amount: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export interface HeatPumpInputs {
  annualHeatingMMBtu: number;
  electricityCentsPerKwh: number;
  naturalGasDollarsPerTherm: number;
  heatPumpHspf2: number;
  furnaceAfuePercent: number;
}

export interface HeatPumpResults {
  annualHeatingMMBtu: number;
  heatPumpKwhConsumed: number;
  heatPumpSeasonalCop: number;
  annualHeatPumpCost: number;
  gasThermsConsumed: number;
  annualGasFurnaceCost: number;
  electricResistanceKwh: number;
  annualElectricResistanceCost: number;
  annualSavingsVsGas: number;
  fiveYearSavingsVsGas: number;
  annualSavingsVsResistance: number;
  fiveYearSavingsVsResistance: number;
  costPerMMBtuHeatPump: number;
  costPerMMBtuGas: number;
  costPerMMBtuResistance: number;
  winterMonthlyHeatPumpCost: number;
  winterMonthlyGasCost: number;
  breakEvenHspf2: number;
  breakEvenCop: number;
}

export interface HvacPreset {
  label: string;
  value: number;
}

export const DEFAULT_HEAT_PUMP_ASSUMPTIONS = {
  heatPumpHspf2: 9.5,
  furnaceAfuePercent: 85,
  referenceHomeSqFt: 2000,
} as const;

export const HEAT_PUMP_PRESETS: readonly HvacPreset[] = [
  { label: "Standard Heat Pump (8.5 HSPF2)", value: 8.5 },
  { label: "Cold-Climate ENERGY STAR (9.5 HSPF2)", value: 9.5 },
  { label: "High-Efficiency Mini-Split (11.0 HSPF2)", value: 11.0 },
];

export const FURNACE_PRESETS: readonly HvacPreset[] = [
  { label: "Standard 80% AFUE", value: 80 },
  { label: "Mid-Efficiency 85% AFUE", value: 85 },
  { label: "Condensing 95% AFUE", value: 95 },
];

/**
 * Pure Heat Pump vs. Natural Gas Furnace & Electric Resistance heating operating cost engine.
 * 1 therm = 100,000 BTU; 1 kWh = 3,412 BTU; COP = HSPF2 / 3.412.
 */
export function calculateHeatPumpVsGasCosts(inputs: HeatPumpInputs): HeatPumpResults {
  const mmbtu = clampFinite(inputs.annualHeatingMMBtu, 0, 300);
  const totalBtu = mmbtu * 1_000_000;
  const elecDollars = clampFinite(inputs.electricityCentsPerKwh, 0) / 100;
  const gasThermDollars = clampFinite(inputs.naturalGasDollarsPerTherm, 0.01);
  const hspf2 = clampFinite(inputs.heatPumpHspf2, 3.412, 20);
  const afue = clampFinite(inputs.furnaceAfuePercent, 50, 100) / 100;

  const heatPumpKwhConsumed = totalBtu / (hspf2 * 1000);
  const heatPumpSeasonalCop = hspf2 / 3.412;
  const annualHeatPumpCost = heatPumpKwhConsumed * elecDollars;

  const gasThermsConsumed = totalBtu / afue / 100_000;
  const annualGasFurnaceCost = gasThermsConsumed * gasThermDollars;

  const electricResistanceKwh = totalBtu / 3412;
  const annualElectricResistanceCost = electricResistanceKwh * elecDollars;

  const annualSavingsVsGas = annualGasFurnaceCost - annualHeatPumpCost;
  const fiveYearSavingsVsGas = annualSavingsVsGas * 5;
  const annualSavingsVsResistance = annualElectricResistanceCost - annualHeatPumpCost;
  const fiveYearSavingsVsResistance = annualSavingsVsResistance * 5;

  const costPerMMBtuHeatPump =
    mmbtu > 0 ? annualHeatPumpCost / mmbtu : (1000 / hspf2) * elecDollars;
  const costPerMMBtuGas =
    mmbtu > 0 ? annualGasFurnaceCost / mmbtu : (10 / afue) * gasThermDollars;
  const costPerMMBtuResistance =
    mmbtu > 0 ? annualElectricResistanceCost / mmbtu : (1_000_000 / 3412) * elecDollars;

  const winterMonthlyHeatPumpCost = annualHeatPumpCost / 5;
  const winterMonthlyGasCost = annualGasFurnaceCost / 5;

  const breakEvenHspf2 = (100 * elecDollars * afue) / gasThermDollars;
  const breakEvenCop = breakEvenHspf2 / 3.412;

  return {
    annualHeatingMMBtu: mmbtu,
    heatPumpKwhConsumed,
    heatPumpSeasonalCop,
    annualHeatPumpCost,
    gasThermsConsumed,
    annualGasFurnaceCost,
    electricResistanceKwh,
    annualElectricResistanceCost,
    annualSavingsVsGas,
    fiveYearSavingsVsGas,
    annualSavingsVsResistance,
    fiveYearSavingsVsResistance,
    costPerMMBtuHeatPump,
    costPerMMBtuGas,
    costPerMMBtuResistance,
    winterMonthlyHeatPumpCost,
    winterMonthlyGasCost,
    breakEvenHspf2,
    breakEvenCop,
  };
}

export interface SolarPaybackInputs {
  systemSizeKw: number;
  electricityCentsPerKwh: number;
  peakSunHours: number;
  monthlyElectricBillUsd: number;
  installCostPerWattUsd: number;
  incentivePercent: number;
  performanceRatio?: number;
}

export interface SolarPaybackResults {
  systemSizeKw: number;
  annualProductionKwh: number;
  monthlyProductionKwh: number;
  annualHouseholdUsageKwh: number;
  billOffsetPercent: number;
  grossSystemCostUsd: number;
  incentiveAmountUsd: number;
  netSystemCostUsd: number;
  firstYearSavingsUsd: number;
  monthlySavingsUsd: number;
  simplePaybackYears: number;
  twentyFiveYearProductionKwh: number;
  twentyFiveYearGrossSavingsUsd: number;
  twentyFiveYearNetProfitUsd: number;
  levelizedSolarCentsPerKwh: number;
}

export const DEFAULT_SOLAR_ASSUMPTIONS = {
  systemSizeKw: 8.0,
  monthlyElectricBillUsd: 180,
  installCostPerWattUsd: 2.85,
  incentivePercent: 0,
  performanceRatio: 0.8,
  annualDegradationRate: 0.005,
  annualUtilityInflationRate: 0.025,
} as const;

export const SOLAR_SIZE_PRESETS: readonly HvacPreset[] = [
  { label: "6 kW Compact", value: 6.0 },
  { label: "8 kW Typical Home", value: 8.0 },
  { label: "10 kW Large / EV Home", value: 10.0 },
];

export const SOLAR_INCENTIVE_PRESETS: readonly HvacPreset[] = [
  { label: "0% (Unsubsidized)", value: 0 },
  { label: "15% State/Utility Rebate", value: 15 },
  { label: "30% Tax Credit / Incentive", value: 30 },
];

/**
 * Pure residential solar PV payback, 25-year net profit, and LCOE calculator.
 * Uses NREL peak sun-hours * 365 * system kW * 0.80 performance ratio, factoring
 * 0.5%/yr panel degradation and 2.5%/yr retail utility escalation over 25 years.
 */
export function calculateSolarPayback(inputs: SolarPaybackInputs): SolarPaybackResults {
  const kw = clampFinite(inputs.systemSizeKw, 0, 50);
  const elecDollars = clampFinite(inputs.electricityCentsPerKwh, 0) / 100;
  const sunHours = clampFinite(inputs.peakSunHours, 1, 10);
  const monthlyBill = clampFinite(inputs.monthlyElectricBillUsd, 0, 5000);
  const costPerWatt = clampFinite(inputs.installCostPerWattUsd, 0.5, 10);
  const incentivePct = clampFinite(inputs.incentivePercent, 0, 80) / 100;
  const perfRatio = clampFinite(
    inputs.performanceRatio ?? DEFAULT_SOLAR_ASSUMPTIONS.performanceRatio,
    0.5,
    0.95
  );

  const annualProductionKwh = kw * sunHours * 365 * perfRatio;
  const monthlyProductionKwh = annualProductionKwh / 12;

  const annualHouseholdUsageKwh = elecDollars > 0 ? (monthlyBill * 12) / elecDollars : 0;
  const billOffsetPercent =
    annualHouseholdUsageKwh > 0
      ? Math.min(100, (annualProductionKwh / annualHouseholdUsageKwh) * 100)
      : 0;

  const grossSystemCostUsd = kw * 1000 * costPerWatt;
  const incentiveAmountUsd = grossSystemCostUsd * incentivePct;
  const netSystemCostUsd = grossSystemCostUsd - incentiveAmountUsd;

  const firstYearSavingsUsd = annualProductionKwh * elecDollars;
  const monthlySavingsUsd = firstYearSavingsUsd / 12;
  const simplePaybackYears =
    firstYearSavingsUsd > 0 ? netSystemCostUsd / firstYearSavingsUsd : 0;

  let twentyFiveYearProductionKwh = 0;
  let twentyFiveYearGrossSavingsUsd = 0;
  for (let year = 0; year < 25; year++) {
    const yearKwh =
      annualProductionKwh * Math.pow(1 - DEFAULT_SOLAR_ASSUMPTIONS.annualDegradationRate, year);
    const yearRate =
      elecDollars * Math.pow(1 + DEFAULT_SOLAR_ASSUMPTIONS.annualUtilityInflationRate, year);
    twentyFiveYearProductionKwh += yearKwh;
    twentyFiveYearGrossSavingsUsd += yearKwh * yearRate;
  }

  const twentyFiveYearNetProfitUsd = twentyFiveYearGrossSavingsUsd - netSystemCostUsd;
  const levelizedSolarCentsPerKwh =
    twentyFiveYearProductionKwh > 0
      ? (netSystemCostUsd / twentyFiveYearProductionKwh) * 100
      : 0;

  return {
    systemSizeKw: kw,
    annualProductionKwh,
    monthlyProductionKwh,
    annualHouseholdUsageKwh,
    billOffsetPercent,
    grossSystemCostUsd,
    incentiveAmountUsd,
    netSystemCostUsd,
    firstYearSavingsUsd,
    monthlySavingsUsd,
    simplePaybackYears,
    twentyFiveYearProductionKwh,
    twentyFiveYearGrossSavingsUsd,
    twentyFiveYearNetProfitUsd,
    levelizedSolarCentsPerKwh,
  };
}
