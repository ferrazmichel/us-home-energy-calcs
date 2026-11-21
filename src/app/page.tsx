import Link from "next/link";
import EvChargingCalculator from "@/components/EvChargingCalculator";
import StateExplorer from "@/components/StateExplorer";
import { DATA_METADATA, US_NATIONAL_AVERAGE } from "@/data/usStatesEnergy";
import { formatUsd } from "@/lib/calculators";
import { SITE_CONFIG } from "@/lib/siteConfig";
import {
  ALL_STATES_RANKED,
  getCheapestElectricityStates,
  getMostExpensiveElectricityStates,
  getTopEvSavingsStates,
} from "@/lib/stateRankings";

export default function HomePage() {
  const cheapest = getCheapestElectricityStates(1)[0];
  const mostExpensive = getMostExpensiveElectricityStates(1)[0];
  const topSavings = getTopEvSavingsStates(1)[0];

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description:
      "Free, data-transparent US home energy calculators using state utility pricing to compare EV home charging, gasoline, heat pumps, and residential solar savings.",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Hero */}
      <div className="mb-10 max-w-3xl">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          All 50 US States + Washington, D.C.
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          US Home EV Charging &amp; Energy Savings Calculators
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Compare what it actually costs to plug in an electric vehicle at home versus buying
          gasoline or using public DC fast chargers—with instant, no-signup calculations
          calibrated to your state&apos;s residential electricity rates.
        </p>
      </div>

      {/* Interactive Calculator (US Average Baseline) */}
      <EvChargingCalculator key="united-states" profile={US_NATIONAL_AVERAGE} />

      {/* National EV Charging Highlights */}
      <section aria-label="National EV Charging Highlights" className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            National EV Charging Highlights
          </h2>
          <Link
            href="/ev-charging-cost"
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Compare all 51 jurisdictions →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href={`/ev-charging-cost/${cheapest.profile.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-500 hover:shadow-sm"
          >
            <p className="text-xs font-medium text-slate-500">Cheapest State Power</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {cheapest.profile.name} ({cheapest.profile.electricityCentsPerKwh.toFixed(1)}¢/kWh)
            </p>
            <p className="mt-1 text-xs text-emerald-700 font-medium">
              {formatUsd(cheapest.baseline.costPer100MilesHome, 2)} per 100 mi at home →
            </p>
          </Link>

          <Link
            href={`/ev-charging-cost/${mostExpensive.profile.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-500 hover:shadow-sm"
          >
            <p className="text-xs font-medium text-slate-500">Highest State Power</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {mostExpensive.profile.name} (
              {mostExpensive.profile.electricityCentsPerKwh.toFixed(1)}¢/kWh)
            </p>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              {formatUsd(mostExpensive.baseline.costPer100MilesHome, 2)} per 100 mi at home →
            </p>
          </Link>

          <Link
            href={`/ev-charging-cost/${topSavings.profile.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-500 hover:shadow-sm"
          >
            <p className="text-xs font-medium text-slate-500">Biggest Annual EV Savings</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {topSavings.profile.name} (+{formatUsd(topSavings.baseline.annualSavingsVsGas)}/yr)
            </p>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              {topSavings.profile.electricityCentsPerKwh.toFixed(1)}¢/kWh vs. $
              {topSavings.profile.gasPricePerGallon.toFixed(2)}/gal →
            </p>
          </Link>

          <Link
            href="/ev-charging-cost"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition-all hover:border-emerald-500 hover:shadow-sm"
          >
            <p className="text-xs font-medium text-emerald-800">US National Benchmark</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {US_NATIONAL_AVERAGE.electricityCentsPerKwh.toFixed(1)}¢/kWh
            </p>
            <p className="mt-1 text-xs font-semibold text-emerald-800">
              Open full 51-state table →
            </p>
          </Link>
        </div>
      </section>

      {/* Tools Suite Overview */}
      <section className="mt-12 grid gap-5 md:grid-cols-3">
        <Link
          href="/ev-charging-cost"
          className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-500"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Live Now · 51 States
          </span>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            EV Home Charging Cost by State
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            State-specific residential ¢/kWh rates, gas comparisons, eGallon equivalent, and
            5-year fuel savings.
          </p>
        </Link>

        <Link
          href="/heat-pump-vs-gas"
          className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-500"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Live Now · 51 States
          </span>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Heat Pump vs. Gas Furnace
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Climate-zone heating operating cost comparison using residential electricity vs.
            natural gas per therm.
          </p>
        </Link>

        <Link
          href="/solar-payback"
          className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-500"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Live Now · 51 States
          </span>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Residential Solar Payback
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            State net-billing economics and solar irradiance modeling powered by NREL PVWatts
            benchmarks.
          </p>
        </Link>
      </section>

      {/* Browse All 50 States + DC */}
      <section id="states" className="mt-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              EV Home Charging Cost by US State
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Select your state to open a pre-loaded calculator with local electricity and gas
              benchmarks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-500">Source: {DATA_METADATA.sourceLabel}</p>
            <Link
              href="/ev-charging-cost"
              className="rounded-lg border border-emerald-600 bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Open Full 51-State Comparison Table →
            </Link>
          </div>
        </div>

        <StateExplorer states={ALL_STATES_RANKED} />
      </section>
    </div>
  );
}
