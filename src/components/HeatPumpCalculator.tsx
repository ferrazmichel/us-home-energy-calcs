"use client";

import { useMemo, useState } from "react";
import { getDefaultHeatingMMBtu, type StateEnergyProfile } from "@/data/usStatesEnergy";
import {
  calculateHeatPumpVsGasCosts,
  DEFAULT_HEAT_PUMP_ASSUMPTIONS,
  formatUsd,
  FURNACE_PRESETS,
  HEAT_PUMP_PRESETS,
} from "@/lib/calculators";

interface HeatPumpCalculatorProps {
  profile: StateEnergyProfile;
}

function parseInputNumber(raw: string, fallback: number, min: number, max: number): number {
  const trimmed = raw.trim();
  if (trimmed === "") return fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export default function HeatPumpCalculator({ profile }: HeatPumpCalculatorProps) {
  const baseMMBtu = getDefaultHeatingMMBtu(profile.climateZone);
  const smallMMBtu = Math.max(10, Math.round(baseMMBtu * 0.7));
  const largeMMBtu = Math.round(baseMMBtu * 1.4);

  const [annualHeatingMMBtu, setAnnualHeatingMMBtu] = useState<number>(baseMMBtu);
  const [electricityInput, setElectricityInput] = useState<string>(
    profile.electricityCentsPerKwh.toFixed(1)
  );
  const [gasRateInput, setGasRateInput] = useState<string>(
    profile.naturalGasPerTherm.toFixed(2)
  );
  const [hspf2Input, setHspf2Input] = useState<string>(
    DEFAULT_HEAT_PUMP_ASSUMPTIONS.heatPumpHspf2.toFixed(1)
  );
  const [afueInput, setAfueInput] = useState<string>(
    String(DEFAULT_HEAT_PUMP_ASSUMPTIONS.furnaceAfuePercent)
  );

  const electricityCentsPerKwh = parseInputNumber(electricityInput, 0, 0, 100);
  const naturalGasDollarsPerTherm = parseInputNumber(
    gasRateInput,
    profile.naturalGasPerTherm,
    0.1,
    10
  );
  const heatPumpHspf2 = parseInputNumber(
    hspf2Input,
    DEFAULT_HEAT_PUMP_ASSUMPTIONS.heatPumpHspf2,
    3.5,
    18
  );
  const furnaceAfuePercent = parseInputNumber(
    afueInput,
    DEFAULT_HEAT_PUMP_ASSUMPTIONS.furnaceAfuePercent,
    50,
    99
  );

  const results = useMemo(
    () =>
      calculateHeatPumpVsGasCosts({
        annualHeatingMMBtu,
        electricityCentsPerKwh,
        naturalGasDollarsPerTherm,
        heatPumpHspf2,
        furnaceAfuePercent,
      }),
    [
      annualHeatingMMBtu,
      electricityCentsPerKwh,
      naturalGasDollarsPerTherm,
      heatPumpHspf2,
      furnaceAfuePercent,
    ]
  );

  const maxAnnualBar = Math.max(
    results.annualElectricResistanceCost,
    results.annualGasFurnaceCost,
    results.annualHeatPumpCost,
    1
  );

  const handleReset = () => {
    setAnnualHeatingMMBtu(baseMMBtu);
    setElectricityInput(profile.electricityCentsPerKwh.toFixed(1));
    setGasRateInput(profile.naturalGasPerTherm.toFixed(2));
    setHspf2Input(DEFAULT_HEAT_PUMP_ASSUMPTIONS.heatPumpHspf2.toFixed(1));
    setAfueInput(String(DEFAULT_HEAT_PUMP_ASSUMPTIONS.furnaceAfuePercent));
  };

  const isCheaperThanGas = results.annualSavingsVsGas >= 0;

  return (
    <section
      aria-label={`Heat Pump vs. Gas Furnace Calculator for ${profile.name}`}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Interactive Heat Pump vs. Gas Furnace Calculator — {profile.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pre-loaded with {profile.name} residential utility rates (
            {profile.electricityCentsPerKwh.toFixed(1)}¢/kWh &amp; $
            {profile.naturalGasPerTherm.toFixed(2)}/therm) and {profile.climateZone} climate
            heating demand.
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
              <label htmlFor="heatingLoad">Annual Delivered Heating Load</label>
              <span className="font-semibold text-slate-900">
                {annualHeatingMMBtu} MMBtu/yr
              </span>
            </div>
            <input
              id="heatingLoad"
              type="range"
              min={10}
              max={120}
              step={2}
              value={annualHeatingMMBtu}
              onChange={(e) => setAnnualHeatingMMBtu(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-600"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                { label: `Small 1,400 sq ft (${smallMMBtu} MMBtu)`, value: smallMMBtu },
                { label: `Typical 2,000 sq ft (${baseMMBtu} MMBtu)`, value: baseMMBtu },
                { label: `Large 2,800 sq ft (${largeMMBtu} MMBtu)`, value: largeMMBtu },
              ].map((preset) => {
                const active = annualHeatingMMBtu === preset.value;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAnnualHeatingMMBtu(preset.value)}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="hpElecRate"
                className="block text-sm font-medium text-slate-700"
              >
                Electricity Rate (¢/kWh)
              </label>
              <input
                id="hpElecRate"
                type="number"
                inputMode="decimal"
                min={1}
                max={100}
                step={0.1}
                value={electricityInput}
                onChange={(e) => setElectricityInput(e.target.value)}
                onBlur={() => {
                  if (electricityInput.trim() === "") {
                    setElectricityInput(profile.electricityCentsPerKwh.toFixed(1));
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                {profile.abbr} baseline: {profile.electricityCentsPerKwh.toFixed(1)}¢/kWh
              </p>
            </div>

            <div>
              <label
                htmlFor="gasThermRate"
                className="block text-sm font-medium text-slate-700"
              >
                Natural Gas Rate ($/therm)
              </label>
              <input
                id="gasThermRate"
                type="number"
                inputMode="decimal"
                min={0.1}
                max={10}
                step={0.05}
                value={gasRateInput}
                onChange={(e) => setGasRateInput(e.target.value)}
                onBlur={() => {
                  if (gasRateInput.trim() === "") {
                    setGasRateInput(profile.naturalGasPerTherm.toFixed(2));
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                {profile.abbr} residential baseline: ${profile.naturalGasPerTherm.toFixed(2)}/therm
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="hpHspf2"
                className="block text-sm font-medium text-slate-700"
              >
                Heat Pump Efficiency (HSPF2)
              </label>
              <input
                id="hpHspf2"
                type="number"
                inputMode="decimal"
                min={3.5}
                max={18}
                step={0.1}
                value={hspf2Input}
                onChange={(e) => setHspf2Input(e.target.value)}
                onBlur={() => {
                  if (hspf2Input.trim() === "") {
                    setHspf2Input(DEFAULT_HEAT_PUMP_ASSUMPTIONS.heatPumpHspf2.toFixed(1));
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {HEAT_PUMP_PRESETS.map((preset) => {
                  const active = Math.abs(heatPumpHspf2 - preset.value) < 0.05;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setHspf2Input(preset.value.toFixed(1))}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="furnaceAfue"
                className="block text-sm font-medium text-slate-700"
              >
                Gas Furnace Efficiency (AFUE %)
              </label>
              <input
                id="furnaceAfue"
                type="number"
                inputMode="numeric"
                min={50}
                max={99}
                step={1}
                value={afueInput}
                onChange={(e) => setAfueInput(e.target.value)}
                onBlur={() => {
                  if (afueInput.trim() === "") {
                    setAfueInput(String(DEFAULT_HEAT_PUMP_ASSUMPTIONS.furnaceAfuePercent));
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FURNACE_PRESETS.map((preset) => {
                  const active = Math.round(furnaceAfuePercent) === preset.value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setAfueInput(String(preset.value))}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        active
                          ? "bg-slate-800 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-6">
          <div
            className={`rounded-xl border p-5 ${
              isCheaperThanGas
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {isCheaperThanGas
                ? "Heat Pump Annual Operating Savings vs. Gas"
                : "Natural Gas Annual Operating Advantage"}
            </p>
            <p
              className={`mt-1 text-3xl font-extrabold ${
                isCheaperThanGas ? "text-emerald-800" : "text-amber-900"
              }`}
            >
              {isCheaperThanGas
                ? `+${formatUsd(results.annualSavingsVsGas)} / yr saved`
                : `Gas is ${formatUsd(Math.abs(results.annualSavingsVsGas))} / yr cheaper`}
            </p>
            <p className="mt-1.5 text-sm text-slate-700">
              Vs. electric baseboard resistance heating, a heat pump saves{" "}
              <strong className="font-semibold text-emerald-800">
                +{formatUsd(results.annualSavingsVsResistance)}/yr
              </strong>{" "}
              ({formatUsd(results.fiveYearSavingsVsResistance)} over 5 years).
            </p>
          </div>

          {/* Winter Monthly Snapshot */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">Winter Heat Pump / mo</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUsd(results.winterMonthlyHeatPumpCost)}/mo
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">Winter Gas / mo</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUsd(results.winterMonthlyGasCost)}/mo
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">5-Yr vs. Gas</p>
              <p
                className={`mt-1 text-base font-bold ${
                  results.fiveYearSavingsVsGas >= 0 ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {results.fiveYearSavingsVsGas >= 0
                  ? `+${formatUsd(results.fiveYearSavingsVsGas)}`
                  : `-${formatUsd(Math.abs(results.fiveYearSavingsVsGas))}`}
              </p>
            </div>
          </div>

          {/* Visual Bar Comparison */}
          <div className="space-y-3.5 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold text-slate-800">
              Annual Heating Fuel Cost Comparison ({annualHeatingMMBtu} MMBtu Delivered)
            </h3>

            {[
              {
                label: `Heat Pump (${heatPumpHspf2.toFixed(1)} HSPF2 · COP ${results.heatPumpSeasonalCop.toFixed(2)})`,
                value: results.annualHeatPumpCost,
                barClass: "bg-emerald-600",
              },
              {
                label: `Natural Gas Furnace (${Math.round(furnaceAfuePercent)}% AFUE)`,
                value: results.annualGasFurnaceCost,
                barClass: "bg-slate-600",
              },
              {
                label: "Electric Baseboard / Resistance (1.0 COP)",
                value: results.annualElectricResistanceCost,
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

          {/* Unit & Break-Even Metrics */}
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] text-slate-500">Heat Pump / MMBtu</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUsd(results.costPerMMBtuHeatPump, 2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] text-slate-500">Gas / MMBtu</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUsd(results.costPerMMBtuGas, 2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] text-slate-500">Break-Even HSPF2</p>
              <p className="mt-1 text-base font-bold text-emerald-700">
                {results.breakEvenHspf2.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] text-slate-500">Break-Even COP</p>
              <p className="mt-1 text-base font-bold text-emerald-700">
                {results.breakEvenCop.toFixed(2)}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Estimated annual usage:{" "}
            {Math.round(results.heatPumpKwhConsumed).toLocaleString("en-US")} kWh (Heat Pump)
            vs. {Math.round(results.gasThermsConsumed).toLocaleString("en-US")} therms (Gas
            Furnace). Operating cost excludes fixed utility meter fees and installation costs.
          </p>
        </div>
      </div>
    </section>
  );
}
