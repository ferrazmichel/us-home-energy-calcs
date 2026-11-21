import type { Metadata } from "next";
import Link from "next/link";
import HeatPumpCalculator from "@/components/HeatPumpCalculator";
import { DATA_METADATA, US_NATIONAL_AVERAGE } from "@/data/usStatesEnergy";
import { formatUsd } from "@/lib/calculators";
import { SITE_CONFIG } from "@/lib/siteConfig";
import {
  ALL_STATES_HEAT_PUMP_RANKED,
  getTopHeatPumpSavingsStates,
  getTopResistanceSavingsStates,
} from "@/lib/stateRankings";

export const metadata: Metadata = {
  title: "Heat Pump vs. Gas Furnace Cost by State (All 50 States + DC)",
  description: `Compare heat pump (9.5 HSPF2) vs. natural gas furnace (85% AFUE) and electric resistance heating operating costs across all 50 US states and Washington, D.C. (US avg ${US_NATIONAL_AVERAGE.electricityCentsPerKwh.toFixed(1)}¢/kWh & $${US_NATIONAL_AVERAGE.naturalGasPerTherm.toFixed(2)}/therm).`,
  alternates: {
    canonical: "/heat-pump-vs-gas",
  },
  openGraph: {
    title: "Heat Pump vs. Gas Furnace Cost by State (All 50 States + DC)",
    description:
      "State-by-state comparison of residential electricity vs. natural gas heating costs, break-even HSPF2/COP thresholds, and 5-year heat pump savings.",
    url: `${SITE_CONFIG.url}/heat-pump-vs-gas`,
    type: "website",
  },
};

export default function AllStatesHeatPumpPage() {
  const topVsGas = getTopHeatPumpSavingsStates(5);
  const topVsResistance = getTopResistanceSavingsStates(5);
  const sortedByGasSavings = [...ALL_STATES_HEAT_PUMP_RANKED].sort(
    (a, b) => a.heatPumpSavingsRank - b.heatPumpSavingsRank
  );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_CONFIG.url}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Heat Pump vs. Gas Furnace by State",
        item: `${SITE_CONFIG.url}/heat-pump-vs-gas`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 text-xs font-medium text-slate-500">
        <Link href="/" className="hover:text-emerald-700">
          Home
        </Link>{" "}
        <span className="mx-1">/</span>
        <span className="text-slate-800">Heat Pump vs. Gas Furnace</span>
      </nav>

      <header className="mb-8 max-w-4xl">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          All 50 US States + Washington, D.C.
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Heat Pump vs. Gas Furnace Operating Cost by State
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Compare annual heating bills for an ENERGY STAR cold-climate heat pump (9.5 HSPF2 /
          2.78 seasonal COP) against an 85% AFUE natural gas furnace and electric baseboard
          resistance heating—calibrated to your state&apos;s residential electricity and natural
          gas rates.
        </p>
      </header>

      {/* Interactive US Benchmark Calculator */}
      <div className="mb-10">
        <HeatPumpCalculator key="united-states-hp" profile={US_NATIONAL_AVERAGE} />
      </div>

      {/* Top 5 Summary Cards */}
      <section className="mb-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Top 5 States Where Heat Pumps Beat Natural Gas Most
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Highest estimated annual operating savings vs. an 85% AFUE gas furnace
          </p>
          <ul className="mt-4 divide-y divide-slate-100">
            {topVsGas.map((item, idx) => (
              <li
                key={item.profile.slug}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {idx + 1}
                  </span>
                  <Link
                    href={`/heat-pump-vs-gas/${item.profile.slug}`}
                    className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                  >
                    {item.profile.name}
                  </Link>
                </div>
                <span className="font-semibold text-emerald-700">
                  +{formatUsd(item.baseline.annualSavingsVsGas)}/yr{" "}
                  <span className="text-xs font-normal text-slate-500">
                    ({item.profile.electricityCentsPerKwh.toFixed(1)}¢ · $
                    {item.profile.naturalGasPerTherm.toFixed(2)}/th)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Top 5 Savings vs. Electric Baseboard / Resistance Heat
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Upgrading from 1.0 COP electric resistance heating delivers ~64% lower electricity use
          </p>
          <ul className="mt-4 divide-y divide-slate-100">
            {topVsResistance.map((item, idx) => (
              <li
                key={item.profile.slug}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {idx + 1}
                  </span>
                  <Link
                    href={`/heat-pump-vs-gas/${item.profile.slug}`}
                    className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                  >
                    {item.profile.name}
                  </Link>
                </div>
                <span className="font-semibold text-emerald-700">
                  +{formatUsd(item.baseline.annualSavingsVsResistance)}/yr{" "}
                  <span className="text-xs font-normal text-slate-500">
                    ({item.heatingMMBtu} MMBtu load)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Full 51-Jurisdiction Comparison Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-slate-900">
            51-State Heat Pump vs. Gas Furnace Comparison Table
          </h2>
          <span className="text-xs text-slate-500">
            Sorted by Heat Pump Advantage vs. Natural Gas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-3">Rank</th>
                <th className="py-3 pr-4">State</th>
                <th className="py-3 pr-4">Climate / Load</th>
                <th className="py-3 pr-4">Elec. Rate</th>
                <th className="py-3 pr-4">Gas Rate</th>
                <th className="py-3 pr-4">Heat Pump / yr</th>
                <th className="py-3 pr-4">Gas Furnace / yr</th>
                <th className="py-3 pr-4">Break-Even COP</th>
                <th className="py-3">HP vs. Gas Diff.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedByGasSavings.map((item) => {
                const diff = item.baseline.annualSavingsVsGas;
                const hpWins = diff >= 0;
                return (
                  <tr key={item.profile.slug} className="hover:bg-slate-50">
                    <td className="py-3 pr-3 font-medium text-slate-500">
                      #{item.heatPumpSavingsRank}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                      <Link
                        href={`/heat-pump-vs-gas/${item.profile.slug}`}
                        className="text-emerald-700 hover:underline"
                      >
                        {item.profile.name}
                      </Link>{" "}
                      <span className="text-xs font-normal text-slate-400">
                        ({item.profile.abbr})
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 capitalize whitespace-nowrap">
                      {item.profile.climateZone} ({item.heatingMMBtu} MMBtu)
                    </td>
                    <td className="py-3 pr-4 text-slate-800 font-medium">
                      {item.profile.electricityCentsPerKwh.toFixed(1)}¢/kWh
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      ${item.profile.naturalGasPerTherm.toFixed(2)}/th
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(item.baseline.annualHeatPumpCost)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(item.baseline.annualGasFurnaceCost)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {item.baseline.breakEvenCop.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 font-bold whitespace-nowrap ${
                        hpWins ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {hpWins
                        ? `+${formatUsd(diff)}/yr`
                        : `-${formatUsd(Math.abs(diff))}/yr`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p>
            Reference dataset: {DATA_METADATA.sourceLabel} ({DATA_METADATA.baselineVersion}
            ).{" "}
            <Link href="/methodology" className="font-medium text-emerald-700 underline">
              Read full calculation methodology
            </Link>
            .
          </p>
          <Link href="/ev-charging-cost" className="font-semibold text-emerald-700 hover:underline">
            Also view EV Charging Cost by State →
          </Link>
        </div>
      </section>
    </div>
  );
}
