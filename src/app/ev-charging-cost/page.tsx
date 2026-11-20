import type { Metadata } from "next";
import Link from "next/link";
import { DATA_METADATA, US_NATIONAL_AVERAGE } from "@/data/usStatesEnergy";
import { formatUsd } from "@/lib/calculators";
import { SITE_CONFIG } from "@/lib/siteConfig";
import {
  ALL_STATES_RANKED,
  getCheapestElectricityStates,
  getTopEvSavingsStates,
} from "@/lib/stateRankings";

export const metadata: Metadata = {
  title: "EV Charging Cost by State (All 50 States + DC Ranked)",
  description: `Compare residential electricity rates (¢/kWh), full 75 kWh home charge costs, eGallon equivalents, and annual EV vs. gas savings across all 50 US states and Washington, D.C. (US avg ${US_NATIONAL_AVERAGE.electricityCentsPerKwh.toFixed(1)}¢/kWh).`,
  alternates: {
    canonical: "/ev-charging-cost",
  },
  openGraph: {
    title: "EV Charging Cost by State (All 50 States + DC Ranked)",
    description:
      "State-by-state comparison of US residential electricity rates, home EV charging cost per 100 miles, eGallon prices, and annual fuel savings vs. gasoline.",
    url: `${SITE_CONFIG.url}/ev-charging-cost`,
    type: "website",
  },
};

export default function AllStatesEvChargingPage() {
  const cheapestStates = getCheapestElectricityStates(5);
  const topSavingsStates = getTopEvSavingsStates(5);
  const sortedBySavings = [...ALL_STATES_RANKED].sort(
    (a, b) => a.savingsRank - b.savingsRank
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
        name: "EV Charging Cost by State",
        item: `${SITE_CONFIG.url}/ev-charging-cost`,
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
        <span className="text-slate-800">EV Charging Cost by State</span>
      </nav>

      <header className="mb-8 max-w-4xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          EV Charging Cost by State: All 50 States + D.C. Ranked
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Compare baseline residential electricity rates, full 75 kWh home charges, and
          estimated annual fuel savings across every US state. Figures assume 13,500
          miles/year, a 3.4 mi/kWh EV, 85% home charging / 15% public DC fast charging, 90%
          charging efficiency, and a 28 MPG gasoline vehicle.
        </p>
      </header>

      {/* Top 5 Summary Cards */}
      <section className="mb-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Top 5 Lowest Residential Electricity Rates
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Lowest baseline cost per kWh to charge overnight at home
          </p>
          <ul className="mt-4 divide-y divide-slate-100">
            {cheapestStates.map((item, idx) => (
              <li
                key={item.profile.slug}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {idx + 1}
                  </span>
                  <Link
                    href={`/ev-charging-cost/${item.profile.slug}`}
                    className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                  >
                    {item.profile.name}
                  </Link>
                </div>
                <span className="font-semibold text-slate-700">
                  {item.profile.electricityCentsPerKwh.toFixed(1)}¢/kWh ·{" "}
                  <span className="text-emerald-700">
                    {formatUsd(item.fullCharge75Kwh, 2)} / 75 kWh
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Top 5 Highest Annual EV Savings vs. Gas
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Widest spread between state electricity and regular gasoline costs
          </p>
          <ul className="mt-4 divide-y divide-slate-100">
            {topSavingsStates.map((item, idx) => (
              <li
                key={item.profile.slug}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {idx + 1}
                  </span>
                  <Link
                    href={`/ev-charging-cost/${item.profile.slug}`}
                    className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                  >
                    {item.profile.name}
                  </Link>
                </div>
                <span className="font-semibold text-emerald-700">
                  +{formatUsd(item.baseline.annualSavingsVsGas)}/yr{" "}
                  <span className="text-xs font-normal text-slate-500">
                    (${item.profile.gasPricePerGallon.toFixed(2)}/gal)
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
            51-State Home EV Charging Cost Comparison Table
          </h2>
          <span className="text-xs text-slate-500">Sorted by Est. Annual EV Savings</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-3">Rank</th>
                <th className="py-3 pr-4">State</th>
                <th className="py-3 pr-4">Region</th>
                <th className="py-3 pr-4">Elec. Rate</th>
                <th className="py-3 pr-4">Full 75 kWh</th>
                <th className="py-3 pr-4">Home EV / 100 mi</th>
                <th className="py-3 pr-4">Gas Price</th>
                <th className="py-3 pr-4">eGallon Equiv.</th>
                <th className="py-3">Annual Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedBySavings.map((item) => {
                const savings = item.baseline.annualSavingsVsGas;
                const savingsPositive = savings >= 0;
                return (
                  <tr key={item.profile.slug} className="hover:bg-slate-50">
                    <td className="py-3 pr-3 font-medium text-slate-500">
                      #{item.savingsRank}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                      <Link
                        href={`/ev-charging-cost/${item.profile.slug}`}
                        className="text-emerald-700 hover:underline"
                      >
                        {item.profile.name}
                      </Link>{" "}
                      <span className="text-xs font-normal text-slate-400">
                        ({item.profile.abbr})
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{item.profile.region}</td>
                    <td className="py-3 pr-4 text-slate-800 font-medium">
                      {item.profile.electricityCentsPerKwh.toFixed(1)}¢/kWh
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(item.fullCharge75Kwh, 2)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(item.baseline.costPer100MilesHome, 2)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      ${item.profile.gasPricePerGallon.toFixed(2)}/gal
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(item.baseline.equivalentGasPriceDollarsPerGallon, 2)}/gal
                    </td>
                    <td
                      className={`py-3 font-bold whitespace-nowrap ${
                        savingsPositive ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {savingsPositive
                        ? `+${formatUsd(savings)}/yr`
                        : `-${formatUsd(Math.abs(savings))}/yr`}
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
          <Link href="/" className="font-semibold text-emerald-700 hover:underline">
            ← Try the custom US calculator
          </Link>
        </div>
      </section>
    </div>
  );
}

