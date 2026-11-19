"use client";

import { useMemo, useState } from "react";
import type { StateEnergyProfile } from "@/data/usStatesEnergy";
import { calculateEvChargingCosts, formatUsd } from "@/lib/calculators";

interface EvChargingCalculatorProps {
  profile: StateEnergyProfile;
}

export default function EvChargingCalculator({ profile }: EvChargingCalculatorProps) {
  const [annualMiles, setAnnualMiles] = useState<number>(13500);
  const [evMilesPerKwh, setEvMilesPerKwh] = useState<number>(3.4);
  const [gasVehicleMpg, setGasVehicleMpg] = useState<number>(28);
  const [electricityCentsPerKwh, setElectricityCentsPerKwh] = useState<number>(
    profile.electricityCentsPerKwh
  );
  const [gasPricePerGallon, setGasPricePerGallon] = useState<number>(
    profile.gasPricePerGallon
  );
  const [publicFastChargeDollarsPerKwh, setPublicFastChargeDollarsPerKwh] =
    useState<number>(profile.publicFastChargePerKwh);
  const [homeChargingSharePercent, setHomeChargingSharePercent] = useState<number>(85);

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
        chargingEfficiencyPercent: 90,
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

  const handleReset = () => {
    setAnnualMiles(13500);
    setEvMilesPerKwh(3.4);
    setGasVehicleMpg(28);
    setElectricityCentsPerKwh(profile.electricityCentsPerKwh);
    setGasPricePerGallon(profile.gasPricePerGallon);
    setPublicFastChargeDollarsPerKwh(profile.publicFastChargePerKwh);
    setHomeChargingSharePercent(85);
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
            Pre-filled with {profile.name} residential utility and gasoline defaults. Adjust sliders to match your car and tariff.
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
                min={1}
                max={80}
                step={0.1}
                value={electricityCentsPerKwh}
                onChange={(e) => setElectricityCentsPerKwh(Number(e.target.value) || 0)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
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
                min={1}
                max={10}
                step={0.05}
                value={gasPricePerGallon}
                onChange={(e) => setGasPricePerGallon(Number(e.target.value) || 0)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
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
                min={1.2}
                max={6.0}
                step={0.1}
                value={evMilesPerKwh}
                onChange={(e) => setEvMilesPerKwh(Number(e.target.value) || 1.2)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="mt-1 text-xs text-slate-500">
                Typical sedan: 3.4–4.0 | SUV/Truck: 2.2–3.1
              </p>
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
                min={10}
                max={65}
                step={1}
                value={gasVehicleMpg}
                onChange={(e) => setGasVehicleMpg(Number(e.target.value) || 10)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="mt-1 text-xs text-slate-500">
                US light-duty fleet average ~26–30 MPG
              </p>
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
              min={0.1}
              max={1.5}
              step={0.02}
              value={publicFastChargeDollarsPerKwh}
              onChange={(e) =>
                setPublicFastChargeDollarsPerKwh(Number(e.target.value) || 0)
              }
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col justify-between gap-5 lg:col-span-6">
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

          {/* Visual Bar Comparison */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
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
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">EV / 100 mi</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUsd(results.costPer100MilesEv, 2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Gas / 100 mi</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatUsd(results.costPer100MilesGas, 2)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">eGallon Equiv.</p>
              <p className="mt-1 text-base font-bold text-emerald-700">
                {formatUsd(results.equivalentGasPriceDollarsPerGallon, 2)}/gal
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Includes a 10% Level 2 wall-to-battery charging loss factor ({Math.round(results.annualKwhConsumed).toLocaleString("en-US")} kWh/year total electricity draw).
          </p>
        </div>
      </div>
    </section>
  );
}
