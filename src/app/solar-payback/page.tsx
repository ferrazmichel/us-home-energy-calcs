import type { Metadata } from "next";
import Link from "next/link";
import SolarPaybackCalculator from "@/components/SolarPaybackCalculator";
import { DATA_METADATA, US_NATIONAL_AVERAGE } from "@/data/usStatesEnergy";
import { formatUsd } from "@/lib/calculators";
import { SITE_CONFIG } from "@/lib/siteConfig";
import {
  ALL_STATES_SOLAR_RANKED,
  getHighestSunStates,
  getTopSolarPaybackStates,
} from "@/lib/stateRankings";

export const metadata: Metadata = {
  title: "Residential Solar Payback Period by State (All 50 States + DC)",
  description: `Compare rooftop solar payback periods, annual kWh production, levelized solar LCOE (¢/kWh), and 25-year net savings across all 50 US states and Washington, D.C. (US avg ${US_NATIONAL_AVERAGE.electricityCentsPerKwh.toFixed(1)}¢/kWh & ${US_NATIONAL_AVERAGE.peakSunHours.toFixed(1)} peak sun hrs).`,
  alternates: {
    canonical: "/solar-payback",
  },
  openGraph: {
    title: "Residential Solar Payback Period by State (All 50 States + DC)",
    description:
      "State-by-state comparison of US rooftop solar panel payback years, annual kWh output, 25-year net savings, and solar cost per kWh.",
    url: `${SITE_CONFIG.url}/solar-payback`,
    type: "website",
  },
};

export default function AllStatesSolarPaybackPage() {
  const fastestPayback = getTopSolarPaybackStates(5);
  const highestSun = getHighestSunStates(5);
  const sortedByPayback = [...ALL_STATES_SOLAR_RANKED].sort(
    (a, b) => a.paybackRank - b.paybackRank
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
        name: "Solar Payback by State",
        item: `${SITE_CONFIG.url}/solar-payback`,
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
        <span className="text-slate-800">Solar Payback by State</span>
      </nav>

      <header className="mb-8 max-w-4xl">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          All 50 US States + Washington, D.C.
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Residential Solar Payback &amp; Savings by US State
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Estimate how many years it takes for an 8 kW residential solar panel system ($2.85/W
          installed) to pay for itself, how much electricity it generates annually using NREL peak
          sun-hour benchmarks, and your 25-year net profit in every US state.
        </p>
      </header>

      {/* Interactive US Benchmark Calculator */}
      <div className="mb-10">
        <SolarPaybackCalculator key="united-states-solar" profile={US_NATIONAL_AVERAGE} />
      </div>

      {/* Top 5 Summary Cards */}
      <section className="mb-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Top 5 Fastest Solar Payback States
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Shortest unsubsidized simple payback for an 8 kW system ($22,800 gross)
          </p>
          <ul className="mt-4 divide-y divide-slate-100">
            {fastestPayback.map((item, idx) => (
              <li
                key={item.profile.slug}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {idx + 1}
                  </span>
                  <Link
                    href={`/solar-payback/${item.profile.slug}`}
                    className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                  >
                    {item.profile.name}
                  </Link>
                </div>
                <span className="font-semibold text-emerald-700">
                  {item.baseline.simplePaybackYears.toFixed(1)} yrs{" "}
                  <span className="text-xs font-normal text-slate-500">
                    ({item.profile.electricityCentsPerKwh.toFixed(1)}¢ ·{" "}
                    {item.profile.peakSunHours.toFixed(1)} sun hrs)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Top 5 Sunniest States (Peak Sun Hours)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Highest annual kWh production per installed kilowatt (NREL PVWatts benchmark)
          </p>
          <ul className="mt-4 divide-y divide-slate-100">
            {highestSun.map((item, idx) => (
              <li
                key={item.profile.slug}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {idx + 1}
                  </span>
                  <Link
                    href={`/solar-payback/${item.profile.slug}`}
                    className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                  >
                    {item.profile.name}
                  </Link>
                </div>
                <span className="font-semibold text-slate-700">
                  {item.profile.peakSunHours.toFixed(1)} hrs/day ·{" "}
                  <span className="text-emerald-700">
                    {Math.round(item.baseline.annualProductionKwh).toLocaleString("en-US")} kWh/yr
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
            51-State Residential Solar Payback Comparison Table (8 kW Baseline)
          </h2>
          <span className="text-xs text-slate-500">Sorted by Fastest Simple Payback</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-3">Rank</th>
                <th className="py-3 pr-4">State</th>
                <th className="py-3 pr-4">Elec. Rate</th>
                <th className="py-3 pr-4">Peak Sun</th>
                <th className="py-3 pr-4">Annual Output</th>
                <th className="py-3 pr-4">Year-1 Savings</th>
                <th className="py-3 pr-4">Solar LCOE</th>
                <th className="py-3 pr-4">Payback</th>
                <th className="py-3">25-Yr Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedByPayback.map((item) => {
                const netPositive = item.baseline.twentyFiveYearNetProfitUsd >= 0;
                return (
                  <tr key={item.profile.slug} className="hover:bg-slate-50">
                    <td className="py-3 pr-3 font-medium text-slate-500">
                      #{item.paybackRank}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                      <Link
                        href={`/solar-payback/${item.profile.slug}`}
                        className="text-emerald-700 hover:underline"
                      >
                        {item.profile.name}
                      </Link>{" "}
                      <span className="text-xs font-normal text-slate-400">
                        ({item.profile.abbr})
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-800 font-medium">
                      {item.profile.electricityCentsPerKwh.toFixed(1)}¢/kWh
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {item.profile.peakSunHours.toFixed(1)} hrs
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {Math.round(item.baseline.annualProductionKwh).toLocaleString("en-US")} kWh
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(item.baseline.firstYearSavingsUsd)}/yr
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {item.baseline.levelizedSolarCentsPerKwh.toFixed(1)}¢/kWh
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                      {item.baseline.simplePaybackYears.toFixed(1)} yrs
                    </td>
                    <td
                      className={`py-3 font-bold whitespace-nowrap ${
                        netPositive ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {netPositive
                        ? `+${formatUsd(item.baseline.twentyFiveYearNetProfitUsd)}`
                        : `-${formatUsd(Math.abs(item.baseline.twentyFiveYearNetProfitUsd))}`}
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
          <div className="flex flex-wrap gap-4">
            <Link href="/ev-charging-cost" className="font-semibold text-emerald-700 hover:underline">
              EV Charging Cost by State →
            </Link>
            <Link href="/heat-pump-vs-gas" className="font-semibold text-emerald-700 hover:underline">
              Heat Pump vs. Gas →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
