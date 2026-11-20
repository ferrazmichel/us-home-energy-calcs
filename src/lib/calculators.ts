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
