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
  costPer100MilesEv: number;
  costPer100MilesGas: number;
  equivalentGasPriceDollarsPerGallon: number;
}

/**
 * Pure EV home charging vs. gasoline & public fast-charging cost engine.
 * Accounts for wall-to-battery AC/DC charging losses (default 90% efficiency).
 */
export function calculateEvChargingCosts(inputs: EvChargingInputs): EvChargingResults {
  const miles = Math.max(0, inputs.annualMiles);
  const evEff = Math.max(0.5, inputs.evMilesPerKwh);
  const gasMpg = Math.max(1, inputs.gasVehicleMpg);
  const homeRateDollars = Math.max(0, inputs.electricityCentsPerKwh) / 100;
  const publicRateDollars = Math.max(0, inputs.publicFastChargeDollarsPerKwh);
  const gasPrice = Math.max(0, inputs.gasPricePerGallon);
  const homeShare = Math.min(100, Math.max(0, inputs.homeChargingSharePercent)) / 100;
  const chargerEff = Math.min(100, Math.max(60, inputs.chargingEfficiencyPercent ?? 90)) / 100;

  const annualKwhConsumed = (miles / evEff) / chargerEff;
  const annualPureHomeEvCost = annualKwhConsumed * homeRateDollars;
  const annualPurePublicEvCost = annualKwhConsumed * publicRateDollars;
  const annualBlendedEvCost =
    annualPureHomeEvCost * homeShare + annualPurePublicEvCost * (1 - homeShare);

  const annualGallons = miles / gasMpg;
  const annualGasCost = annualGallons * gasPrice;

  const annualSavingsVsGas = annualGasCost - annualBlendedEvCost;
  const fiveYearSavingsVsGas = annualSavingsVsGas * 5;

  const costPer100MilesEv = miles > 0 ? (annualBlendedEvCost / miles) * 100 : 0;
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
    costPer100MilesEv,
    costPer100MilesGas,
    equivalentGasPriceDollarsPerGallon,
  };
}

export function formatUsd(amount: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
