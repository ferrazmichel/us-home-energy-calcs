"use client";

import { useMemo, useState } from "react";
import type { StateEnergyProfile } from "@/data/usStatesEnergy";
import {
  calculateEvChargingCosts,
  DEFAULT_EV_ASSUMPTIONS,
  EV_PRESETS,
  formatUsd,
  GAS_PRESETS,
} from "@/lib/calculators";

interface EvChargingCalculatorProps {
  profile: StateEnergyProfile;
}

function parseInputNumber(raw: string, fallback: number, min: number, max: number): number {
  const trimmed = raw.trim();
  if (trimmed === "") return fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export default function EvChargingCalculator({ profile }: EvChargingCalculatorProps) {
  const [annualMiles, setAnnualMiles] = useState<number>(DEFAULT_EV_ASSUMPTIONS.annualMiles);
  const [evEffInput, setEvEffInput] = useState<string>(
    DEFAULT_EV_ASSUMPTIONS.evMilesPerKwh.toFixed(1)
  );
  const [gasMpgInput, setGasMpgInput] = useState<string>(
    String(DEFAULT_EV_ASSUMPTIONS.gasVehicleMpg)
  );
  const [electricityInput, setElectricityInput] = useState<string>(
    profile.electricityCentsPerKwh.toFixed(1)
  );
  const [gasPriceInput, setGasPriceInput] = useState<string>(
    profile.gasPricePerGallon.toFixed(2)
  );
  const [publicRateInput, setPublicRateInput] = useState<string>(
    profile.publicFastChargePerKwh.toFixed(2)
  );
  const [homeChargingSharePercent, setHomeChargingSharePercent] = useState<number>(
    DEFAULT_EV_ASSUMPTIONS.homeChargingSharePercent
  );

  const evMilesPerKwh = parseInputNumber(
    evEffInput,
    DEFAULT_EV_ASSUMPTIONS.evMilesPerKwh,
    0.5,
    8.0
  );
  const gasVehicleMpg = parseInputNumber(
    gasMpgInput,
    DEFAULT_EV_ASSUMPTIONS.gasVehicleMpg,
    5,
    100
  );
  const electricityCentsPerKwh = parseInputNumber(electricityInput, 0, 0, 100);
  const gasPricePerGallon = parseInputNumber(gasPriceInput, 0, 0, 15);
  const publicFastChargeDollarsPerKwh = parseInputNumber(publicRateInput, 0, 0, 3);

  const results = useMemo(
    () =>
      calculateEvChargingCosts({
        annualMiles,
        evMilesPerKwh,
        gasVehicleMpg,
        electricityCentsPerKwh,
        gasPricePerGallon,
        publicFastChargeDollarsPerKwh,
        homeChargingSharePercent,
        chargingEfficiencyPercent: DEFAULT_EV_ASSUMPTIONS.chargingEfficiencyPercent,
      }),
    [
      annualMiles,
      evMilesPerKwh,
      gasVehicleMpg,
      electricityCentsPerKwh,
      gasPricePerGallon,
      publicFastChargeDollarsPerKwh,
      homeChargingSharePercent,
    ]
  );

  const maxAnnualBar = Math.max(
    results.annualGasCost,
    results.annualPurePublicEvCost,
    results.annualBlendedEvCost,
    1
  );

  const stateAvgRateStr = profile.electricityCentsPerKwh.toFixed(1);
  const offPeakRateStr = (profile.electricityCentsPerKwh * 0.7).toFixed(1);
  const isStateAvgSelected = electricityInput.trim() === stateAvgRateStr;
  const isOffPeakSelected = electricityInput.trim() === offPeakRateStr;

  const handleReset = () => {
    setAnnualMiles(DEFAULT_EV_ASSUMPTIONS.annualMiles);
    setEvEffInput(DEFAULT_EV_ASSUMPTIONS.evMilesPerKwh.toFixed(1));
    setGasMpgInput(String(DEFAULT_EV_ASSUMPTIONS.gasVehicleMpg));
    setElectricityInput(profile.electricityCentsPerKwh.toFixed(1));
    setGasPriceInput(profile.gasPricePerGallon.toFixed(2));
    setPublicRateInput(profile.publicFastChargePerKwh.toFixed(2));
    setHomeChargingSharePercent(DEFAULT_EV_ASSUMPTIONS.homeChargingSharePercent);
  };

  const isSavingMoney = results.annualSavingsVsGas >= 0;

  return (
    <section
      aria-label={`EV Home Charging Calculator for ${profile.name}`}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Interactive EV Charging Cost Calculator — {profile.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pre-filled with {profile.name} residential utility and gasoline defaults. Pick a
            vehicle preset or enter your own utility rate.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Reset to {profile.abbr} Defaults
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Controls */}
        <div className="space-y-5 lg:col-span-6">
          <div>
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <label htmlFor="annualMiles">Annual Miles Driven</label>
              <span className="font-semibold text-slate-900">
                {annualMiles.toLocaleString("en-US")} mi/yr
              </span>
            </div>
            <input
              id="annualMiles"
              type="range"
              min={3000}
              max={35000}
              step={500}
              value={annualMiles}
              onChange={(e) => setAnnualMiles(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-600"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="electricityRate"
                className="block text-sm font-medium text-slate-700"
              >
                Home Electricity Rate (¢/kWh)
              </label>
              <input
                id="electricityRate"
                type="number"
                inputMode="decimal"
                min={1}
                max={100}
                step={0.1}
                value={electricityInput}
                onChange={(e) => setElectricityInput(e.target.value)}
                onBlur={() => {
                  if (electricityInput.trim() === "") {
                    setElectricityInput(stateAvgRateStr);
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setElectricityInput(stateAvgRateStr)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    isStateAvgSelected
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {profile.abbr} Avg ({stateAvgRateStr}¢)
                </button>
                <button
                  type="button"
                  onClick={() => setElectricityInput(offPeakRateStr)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    isOffPeakSelected
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Est. Off-Peak TOU ({offPeakRateStr}¢)
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="gasPrice"
                className="block text-sm font-medium text-slate-700"
              >
                Gasoline Price ($/gallon)
              </label>
              <input
                id="gasPrice"
                type="number"
                inputMode="decimal"
                min={1}
                max={15}
                step={0.05}
                value={gasPriceInput}
                onChange={(e) => setGasPriceInput(e.target.value)}
                onBlur={() => {
                  if (gasPriceInput.trim() === "") {
                    setGasPriceInput(profile.gasPricePerGallon.toFixed(2));
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="mt-2 text-[11px] text-slate-500">
                {profile.abbr} regular-grade baseline: ${profile.gasPricePerGallon.toFixed(2)}/gal
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="evEff"
                className="block text-sm font-medium text-slate-700"
              >
                EV Efficiency (mi/kWh)
              </label>
              <input
                id="evEff"
                type="number"
                inputMode="decimal"
                min={0.5}
                max={8.0}
                step={0.1}
                value={evEffInput}
                onChange={(e) => setEvEffInput(e.target.value)}
                onBlur={() => {
                  if (evEffInput.trim() === "") {
                    setEvEffInput(DEFAULT_EV_ASSUMPTIONS.evMilesPerKwh.toFixed(1));
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {EV_PRESETS.map((preset) => {
                  const active = Math.abs(evMilesPerKwh - preset.efficiency) < 0.05;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setEvEffInput(preset.efficiency.toFixed(1))}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label} ({preset.efficiency})
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="gasMpg"
                className="block text-sm font-medium text-slate-700"
              >
                Comparison Gas Car (MPG)
              </label>
              <input
                id="gasMpg"
                type="number"
                inputMode="numeric"
                min={5}
                max={100}
                step={1}
                value={gasMpgInput}
                onChange={(e) => setGasMpgInput(e.target.value)}
                onBlur={() => {
                  if (gasMpgInput.trim() === "") {
                    setGasMpgInput(String(DEFAULT_EV_ASSUMPTIONS.gasVehicleMpg));
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {GAS_PRESETS.map((preset) => {
                  const active = Math.round(gasVehicleMpg) === preset.efficiency;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setGasMpgInput(String(preset.efficiency))}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        active
                          ? "bg-slate-800 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label} ({preset.efficiency})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <label htmlFor="homeShare">Charging Done at Home</label>
              <span className="font-semibold text-slate-900">
                {homeChargingSharePercent}% home / {100 - homeChargingSharePercent}% public DCFC
              </span>
            </div>
            <input
              id="homeShare"
              type="range"
              min={0}
              max={100}
              step={5}
              value={homeChargingSharePercent}
              onChange={(e) => setHomeChargingSharePercent(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-600"
            />
          </div>

          <div>
            <label
              htmlFor="publicRate"
              className="block text-sm font-medium text-slate-700"
            >
              Public Fast-Charger Rate ($/kWh)
            </label>
            <input
              id="publicRate"
              type="number"
              inputMode="decimal"
              min={0.05}
              max={3.0}
              step={0.02}
              value={publicRateInput}
              onChange={(e) => setPublicRateInput(e.target.value)}
              onBlur={() => {
                if (publicRateInput.trim() === "") {
                  setPublicRateInput(profile.publicFastChargePerKwh.toFixed(2));
                }
              }}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-6">
          <div
            className={`rounded-xl border p-5 ${
              isSavingMoney
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {isSavingMoney ? "Estimated Annual Fuel Savings" : "Estimated Annual Fuel Difference"}
            </p>
            <p
              className={`mt-1 text-3xl font-extrabold ${
                isSavingMoney ? "text-emerald-800" : "text-amber-900"
              }`}
            >
              {isSavingMoney
                ? `${formatUsd(results.annualSavingsVsGas)} / yr`
                : `-${formatUsd(Math.abs(results.annualSavingsVsGas))} / yr`}
            </p>
            <p className="mt-1.5 text-sm text-slate-700">
              5-year cumulative impact:{" "}
              <strong className="font-semibold">
                {results.fiveYearSavingsVsGas >= 0
                  ? `${formatUsd(results.fiveYearSavingsVsGas)} saved`
                  : `${formatUsd(Math.abs(results.fiveYearSavingsVsGas))} higher vs. gas`}
              </strong>
            </p>
          </div>

          {/* Monthly Snapshot */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">Monthly EV (Mix)</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUsd(results.monthlyBlendedEvCost)}/mo
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">Monthly Gas</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUsd(results.monthlyGasCost)}/mo
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">Monthly Diff.</p>
              <p
                className={`mt-1 text-base font-bold ${
                  results.monthlySavingsVsGas >= 0 ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {results.monthlySavingsVsGas >= 0
                  ? `+${formatUsd(results.monthlySavingsVsGas)}/mo`
                  : `-${formatUsd(Math.abs(results.monthlySavingsVsGas))}/mo`}
              </p>
            </div>
          </div>

          {/* Visual Bar Comparison */}
          <div className="space-y-3.5 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold text-slate-800">
              Annual Energy &amp; Fuel Cost Comparison
            </h3>

            {[
              {
                label: `Your EV Mix (${homeChargingSharePercent}% Home)`,
                value: results.annualBlendedEvCost,
                barClass: "bg-emerald-600",
              },
              {
                label: "100% Home Charging",
                value: results.annualPureHomeEvCost,
                barClass: "bg-teal-500",
              },
              {
                label: "Comparable Gas Vehicle",
                value: results.annualGasCost,
                barClass: "bg-slate-600",
              },
              {
                label: "100% Public DC Fast Charging",
                value: results.annualPurePublicEvCost,
                barClass: "bg-amber-500",
              },
            ].map((row) => {
              const widthPct = Math.min(100, Math.max(4, (row.value / maxAnnualBar) * 100));
              return (
                <div key={row.label}>
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{row.label}</span>
                    <span className="font-semibold text-slate-900">
                      {formatUsd(row.value)}/yr
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${row.barClass} transition-all duration-300`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unit Metrics */}
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] text-slate-500">100% Home / 100 mi</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUsd(results.costPer100MilesHome, 2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] text-slate-500">Your Mix / 100 mi</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUsd(results.costPer100MilesEv, 2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] text-slate-500">Gas / 100 mi</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUsd(results.costPer100MilesGas, 2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] text-slate-500">eGallon Equiv.</p>
              <p className="mt-1 text-base font-bold text-emerald-700">
                {formatUsd(results.equivalentGasPriceDollarsPerGallon, 2)}/gal
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Includes a 10% Level 2 wall-to-battery charging loss factor (
            {Math.round(results.annualKwhConsumed).toLocaleString("en-US")} kWh/year total
            electricity draw).
          </p>
        </div>
      </div>
    </section>
  );
}
