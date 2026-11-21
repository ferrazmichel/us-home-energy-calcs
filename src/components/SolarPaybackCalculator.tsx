"use client";

import { useMemo, useState } from "react";
import type { StateEnergyProfile } from "@/data/usStatesEnergy";
import {
  calculateSolarPayback,
  DEFAULT_SOLAR_ASSUMPTIONS,
  formatUsd,
  SOLAR_INCENTIVE_PRESETS,
  SOLAR_SIZE_PRESETS,
} from "@/lib/calculators";

interface SolarPaybackCalculatorProps {
  profile: StateEnergyProfile;
}

function parseInputNumber(raw: string, fallback: number, min: number, max: number): number {
  const trimmed = raw.trim();
  if (trimmed === "") return fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export default function SolarPaybackCalculator({ profile }: SolarPaybackCalculatorProps) {
  const [systemSizeKw, setSystemSizeKw] = useState<number>(DEFAULT_SOLAR_ASSUMPTIONS.systemSizeKw);
  const [monthlyBillUsd, setMonthlyBillUsd] = useState<number>(
    DEFAULT_SOLAR_ASSUMPTIONS.monthlyElectricBillUsd
  );
  const [electricityInput, setElectricityInput] = useState<string>(
    profile.electricityCentsPerKwh.toFixed(1)
  );
  const [sunHoursInput, setSunHoursInput] = useState<string>(profile.peakSunHours.toFixed(1));
  const [costPerWattInput, setCostPerWattInput] = useState<string>(
    DEFAULT_SOLAR_ASSUMPTIONS.installCostPerWattUsd.toFixed(2)
  );
  const [incentivePercent, setIncentivePercent] = useState<number>(
    DEFAULT_SOLAR_ASSUMPTIONS.incentivePercent
  );

  const electricityCentsPerKwh = parseInputNumber(electricityInput, 0, 0, 100);
  const peakSunHours = parseInputNumber(sunHoursInput, profile.peakSunHours, 1, 10);
  const installCostPerWattUsd = parseInputNumber(
    costPerWattInput,
    DEFAULT_SOLAR_ASSUMPTIONS.installCostPerWattUsd,
    0.5,
    10
  );

  const results = useMemo(
    () =>
      calculateSolarPayback({
        systemSizeKw,
        electricityCentsPerKwh,
        peakSunHours,
        monthlyElectricBillUsd: monthlyBillUsd,
        installCostPerWattUsd,
        incentivePercent,
        performanceRatio: DEFAULT_SOLAR_ASSUMPTIONS.performanceRatio,
      }),
    [
      systemSizeKw,
      electricityCentsPerKwh,
      peakSunHours,
      monthlyBillUsd,
      installCostPerWattUsd,
      incentivePercent,
    ]
  );

  const handleReset = () => {
    setSystemSizeKw(DEFAULT_SOLAR_ASSUMPTIONS.systemSizeKw);
    setMonthlyBillUsd(DEFAULT_SOLAR_ASSUMPTIONS.monthlyElectricBillUsd);
    setElectricityInput(profile.electricityCentsPerKwh.toFixed(1));
    setSunHoursInput(profile.peakSunHours.toFixed(1));
    setCostPerWattInput(DEFAULT_SOLAR_ASSUMPTIONS.installCostPerWattUsd.toFixed(2));
    setIncentivePercent(DEFAULT_SOLAR_ASSUMPTIONS.incentivePercent);
  };

  const rateComparisonMax = Math.max(electricityCentsPerKwh, results.levelizedSolarCentsPerKwh, 1);
  const utilityBarWidth = Math.min(100, Math.max(4, (electricityCentsPerKwh / rateComparisonMax) * 100));
  const solarBarWidth = Math.min(
    100,
    Math.max(4, (results.levelizedSolarCentsPerKwh / rateComparisonMax) * 100)
  );

  return (
    <section
      aria-label={`Residential Solar Payback Calculator for ${profile.name}`}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Interactive Residential Solar Payback Calculator — {profile.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pre-loaded with {profile.name}&apos;s residential electricity rate (
            {profile.electricityCentsPerKwh.toFixed(1)}¢/kWh) and NREL peak sun-hours benchmark (
            {profile.peakSunHours.toFixed(1)} hrs/day).
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
              <label htmlFor="solarSystemSize">Solar System Size (DC)</label>
              <span className="font-semibold text-slate-900">{systemSizeKw.toFixed(1)} kW</span>
            </div>
            <input
              id="solarSystemSize"
              type="range"
              min={3}
              max={20}
              step={0.5}
              value={systemSizeKw}
              onChange={(e) => setSystemSizeKw(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-600"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SOLAR_SIZE_PRESETS.map((preset) => {
                const active = Math.abs(systemSizeKw - preset.value) < 0.05;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSystemSizeKw(preset.value)}
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

          <div>
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <label htmlFor="monthlyBill">Current Monthly Electric Bill</label>
              <span className="font-semibold text-slate-900">${monthlyBillUsd}/mo</span>
            </div>
            <input
              id="monthlyBill"
              type="range"
              min={50}
              max={600}
              step={10}
              value={monthlyBillUsd}
              onChange={(e) => setMonthlyBillUsd(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-600"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="solarElecRate"
                className="block text-sm font-medium text-slate-700"
              >
                Utility Electricity Rate (¢/kWh)
              </label>
              <input
                id="solarElecRate"
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
                htmlFor="solarSunHours"
                className="block text-sm font-medium text-slate-700"
              >
                Peak Sun Hours (hrs/day)
              </label>
              <input
                id="solarSunHours"
                type="number"
                inputMode="decimal"
                min={1}
                max={10}
                step={0.1}
                value={sunHoursInput}
                onChange={(e) => setSunHoursInput(e.target.value)}
                onBlur={() => {
                  if (sunHoursInput.trim() === "") {
                    setSunHoursInput(profile.peakSunHours.toFixed(1));
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                {profile.abbr} NREL avg: {profile.peakSunHours.toFixed(1)} hrs/day
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="costPerWatt"
                className="block text-sm font-medium text-slate-700"
              >
                Installed Cost ($/Watt DC)
              </label>
              <input
                id="costPerWatt"
                type="number"
                inputMode="decimal"
                min={0.5}
                max={10}
                step={0.05}
                value={costPerWattInput}
                onChange={(e) => setCostPerWattInput(e.target.value)}
                onBlur={() => {
                  if (costPerWattInput.trim() === "") {
                    setCostPerWattInput(DEFAULT_SOLAR_ASSUMPTIONS.installCostPerWattUsd.toFixed(2));
                  }
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                Gross cost: {formatUsd(results.grossSystemCostUsd)}
              </p>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700">
                State / Utility Rebate or Incentive
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SOLAR_INCENTIVE_PRESETS.map((preset) => {
                  const active = incentivePercent === preset.value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setIncentivePercent(preset.value)}
                      className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
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
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-6">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Estimated Simple Payback Period
            </p>
            <p className="mt-1 text-3xl font-extrabold text-emerald-800">
              {results.simplePaybackYears.toFixed(1)} years
            </p>
            <p className="mt-1.5 text-sm text-slate-700">
              Net system cost of{" "}
              <strong className="font-semibold">{formatUsd(results.netSystemCostUsd)}</strong>{" "}
              earns back{" "}
              <strong className="font-semibold text-emerald-800">
                {formatUsd(results.firstYearSavingsUsd)}/yr
              </strong>{" "}
              in Year-1 electricity savings.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">Year-1 Output</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {Math.round(results.annualProductionKwh).toLocaleString("en-US")} kWh
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">Est. Bill Offset</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {Math.round(results.billOffsetPercent)}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium text-slate-500">25-Yr Net Profit</p>
              <p
                className={`mt-1 text-base font-bold ${
                  results.twentyFiveYearNetProfitUsd >= 0 ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {results.twentyFiveYearNetProfitUsd >= 0
                  ? `+${formatUsd(results.twentyFiveYearNetProfitUsd)}`
                  : `-${formatUsd(Math.abs(results.twentyFiveYearNetProfitUsd))}`}
              </p>
            </div>
          </div>

          {/* Locked-In Solar Rate Comparison */}
          <div className="space-y-3.5 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold text-slate-800">
              Effective Solar Energy Rate vs. Utility Retail Rate
            </h3>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Locked-In 25-Yr Solar Cost (LCOE)</span>
                <span className="font-semibold text-emerald-700">
                  {results.levelizedSolarCentsPerKwh.toFixed(1)}¢/kWh
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${solarBarWidth}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Current Utility Electricity Rate</span>
                <span className="font-semibold text-slate-900">
                  {electricityCentsPerKwh.toFixed(1)}¢/kWh
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-600 transition-all duration-300"
                  style={{ width: `${utilityBarWidth}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Models an 80% DC-to-AC performance ratio, 0.5%/yr panel degradation, and 2.5%/yr
            utility rate inflation over 25 years. Actual payback varies by net-metering rules and
            roof shading.
          </p>
        </div>
      </div>
    </section>
  );
}
