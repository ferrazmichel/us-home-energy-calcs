import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EvChargingCalculator from "@/components/EvChargingCalculator";
import StateQuickSwitcher from "@/components/StateQuickSwitcher";
import {
  DATA_METADATA,
  getClimateEvNote,
  getRelatedStates,
  getStateBySlug,
  US_NATIONAL_AVERAGE,
  US_STATES_ENERGY,
} from "@/data/usStatesEnergy";
import {
  calculateChargingSessions,
  calculateEvChargingCosts,
  calculateFullChargeCost,
  DEFAULT_EV_ASSUMPTIONS,
  formatUsd,
} from "@/lib/calculators";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getStateRankingBySlug } from "@/lib/stateRankings";

type StatePageProps = {
  params: Promise<{ state: string }>;
};

export function generateStaticParams() {
  return US_STATES_ENERGY.map((item) => ({
    state: item.slug,
  }));
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state: slug } = await params;
  const profile = getStateBySlug(slug);
  if (!profile) {
    return {
      title: "State Not Found",
    };
  }

  const baseline = calculateEvChargingCosts({
    annualMiles: DEFAULT_EV_ASSUMPTIONS.annualMiles,
    evMilesPerKwh: DEFAULT_EV_ASSUMPTIONS.evMilesPerKwh,
    gasVehicleMpg: DEFAULT_EV_ASSUMPTIONS.gasVehicleMpg,
    electricityCentsPerKwh: profile.electricityCentsPerKwh,
    gasPricePerGallon: profile.gasPricePerGallon,
    publicFastChargeDollarsPerKwh: profile.publicFastChargePerKwh,
    homeChargingSharePercent: DEFAULT_EV_ASSUMPTIONS.homeChargingSharePercent,
  });

  const title = `Cost to Charge an EV at Home in ${profile.name} (Calculator & Rates)`;
  const description = `At ${profile.electricityCentsPerKwh.toFixed(1)}¢/kWh residential electricity and $${profile.gasPricePerGallon.toFixed(2)}/gal gas, home EV charging in ${profile.name} averages ${formatUsd(baseline.costPer100MilesHome, 2)} per 100 miles (${formatUsd(baseline.annualSavingsVsGas)}/yr estimated savings vs. gas).`;

  return {
    title,
    description,
    alternates: {
      canonical: `/ev-charging-cost/${profile.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/ev-charging-cost/${profile.slug}`,
      type: "article",
    },
  };
}

export default async function StateEvChargingPage({ params }: StatePageProps) {
  const { state: slug } = await params;
  const profile = getStateBySlug(slug);

  if (!profile) {
    notFound();
  }

  const ranking = getStateRankingBySlug(profile.slug);

  const standardMiles = [10000, 13500, 20000];
  const scenarios = standardMiles.map((miles) => ({
    miles,
    ...calculateEvChargingCosts({
      annualMiles: miles,
      evMilesPerKwh: DEFAULT_EV_ASSUMPTIONS.evMilesPerKwh,
      gasVehicleMpg: DEFAULT_EV_ASSUMPTIONS.gasVehicleMpg,
      electricityCentsPerKwh: profile.electricityCentsPerKwh,
      gasPricePerGallon: profile.gasPricePerGallon,
      publicFastChargeDollarsPerKwh: profile.publicFastChargePerKwh,
      homeChargingSharePercent: DEFAULT_EV_ASSUMPTIONS.homeChargingSharePercent,
    }),
  }));

  const defaultScenario = scenarios[1];
  const usBenchmark = calculateEvChargingCosts({
    annualMiles: DEFAULT_EV_ASSUMPTIONS.annualMiles,
    evMilesPerKwh: DEFAULT_EV_ASSUMPTIONS.evMilesPerKwh,
    gasVehicleMpg: DEFAULT_EV_ASSUMPTIONS.gasVehicleMpg,
    electricityCentsPerKwh: US_NATIONAL_AVERAGE.electricityCentsPerKwh,
    gasPricePerGallon: US_NATIONAL_AVERAGE.gasPricePerGallon,
    publicFastChargeDollarsPerKwh: US_NATIONAL_AVERAGE.publicFastChargePerKwh,
    homeChargingSharePercent: DEFAULT_EV_ASSUMPTIONS.homeChargingSharePercent,
  });

  const rateDiffPct =
    ((profile.electricityCentsPerKwh - US_NATIONAL_AVERAGE.electricityCentsPerKwh) /
      US_NATIONAL_AVERAGE.electricityCentsPerKwh) *
    100;
  const rateDiffLabel =
    Math.abs(rateDiffPct) < 2
      ? "near the US national average"
      : rateDiffPct > 0
      ? `${rateDiffPct.toFixed(0)}% above the US average`
      : `${Math.abs(rateDiffPct).toFixed(0)}% below the US average`;

  const costFull75Kwh = calculateFullChargeCost(
    DEFAULT_EV_ASSUMPTIONS.batteryKwh,
    profile.electricityCentsPerKwh,
    DEFAULT_EV_ASSUMPTIONS.chargingEfficiencyPercent
  );
  const chargingSessions = calculateChargingSessions(
    profile.electricityCentsPerKwh,
    DEFAULT_EV_ASSUMPTIONS.chargingEfficiencyPercent
  );
  const relatedStates = getRelatedStates(profile, 6);
  const switcherStates = US_STATES_ENERGY.map((st) => ({
    slug: st.slug,
    name: st.name,
    abbr: st.abbr,
  }));

  const faqs = [
    {
      question: `How much does it cost to charge an EV at home in ${profile.name}?`,
      answer: `Using ${profile.name}'s baseline residential rate of ${profile.electricityCentsPerKwh.toFixed(1)}¢/kWh (including 10% Level 2 charging losses), fueling a 3.4 mi/kWh EV entirely at home costs roughly ${formatUsd(defaultScenario.costPer100MilesHome, 2)} per 100 miles, or about ${formatUsd(defaultScenario.monthlyPureHomeEvCost)}/month at 13,500 miles per year.`,
    },
    {
      question: `How much does a full 0–100% home charge cost in ${profile.name}?`,
      answer: `Charging a 75 kWh EV battery from empty to full at ${profile.electricityCentsPerKwh.toFixed(1)}¢/kWh (with 90% charging efficiency) costs approximately ${formatUsd(costFull75Kwh, 2)}. Most drivers top up daily rather than draining to 0%.`,
    },
    {
      question: `Is owning an EV cheaper than a gas car in ${profile.name}?`,
      answer: `Compared with a 28 MPG gasoline vehicle at $${profile.gasPricePerGallon.toFixed(2)}/gallon, driving 13,500 miles/year with 85% home charging yields an estimated ${defaultScenario.annualSavingsVsGas >= 0 ? `${formatUsd(defaultScenario.annualSavingsVsGas)} in annual fuel savings` : `${formatUsd(Math.abs(defaultScenario.annualSavingsVsGas))} higher annual energy cost`} in ${profile.name}. Enrolling in an overnight time-of-use utility plan can improve savings further.`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

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
      {
        "@type": "ListItem",
        position: 3,
        name: profile.name,
        item: `${SITE_CONFIG.url}/ev-charging-cost/${profile.slug}`,
      },
    ],
  };

  const defaultSavingsPositive = defaultScenario.annualSavingsVsGas >= 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb + State Quick Switcher */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="text-xs font-medium text-slate-500">
          <Link href="/" className="hover:text-emerald-700">
            Home
          </Link>{" "}
          <span className="mx-1">/</span>
          <Link href="/ev-charging-cost" className="hover:text-emerald-700">
            States
          </Link>{" "}
          <span className="mx-1">/</span>
          <span className="text-slate-800">{profile.name}</span>
        </nav>

        <StateQuickSwitcher currentSlug={profile.slug} states={switcherStates} />
      </div>

      {/* Header */}
      <header className="mb-8 max-w-4xl">
        {ranking ? (
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              #{ranking.electricityRank} of {ranking.totalStates} lowest residential electricity rate
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              #{ranking.savingsRank} of {ranking.totalStates} highest EV savings vs. gas
            </span>
          </div>
        ) : null}

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Cost to Charge an EV at Home in {profile.name}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          {profile.name}&apos;s baseline residential electricity rate is{" "}
          <strong className="font-semibold text-slate-900">
            {profile.electricityCentsPerKwh.toFixed(1)}¢/kWh
          </strong>{" "}
          ({rateDiffLabel}), compared with{" "}
          <strong className="font-semibold text-slate-900">
            ${profile.gasPricePerGallon.toFixed(2)}/gallon
          </strong>{" "}
          for regular gasoline. {profile.usAvgComparisonNote}
        </p>
      </header>

      {/* Snapshot KPI Cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            {profile.abbr} Residential Electricity
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {profile.electricityCentsPerKwh.toFixed(1)}¢/kWh
          </p>
          <p className="mt-1 text-xs text-slate-500">
            US Avg: {US_NATIONAL_AVERAGE.electricityCentsPerKwh.toFixed(1)}¢/kWh
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Full 75 kWh Home Charge</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatUsd(costFull75Kwh, 2)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Includes 10% charger loss</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">EV Equivalent Gallon</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {formatUsd(defaultScenario.equivalentGasPriceDollarsPerGallon, 2)}/gal
          </p>
          <p className="mt-1 text-xs text-slate-500">
            vs. ${profile.gasPricePerGallon.toFixed(2)}/gal regular gas
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Est. Annual Savings (13.5k mi)</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              defaultSavingsPositive ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {defaultSavingsPositive
              ? formatUsd(defaultScenario.annualSavingsVsGas)
              : `-${formatUsd(Math.abs(defaultScenario.annualSavingsVsGas))}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            US Avg Savings: {formatUsd(usBenchmark.annualSavingsVsGas)}/yr
          </p>
        </div>
      </section>

      {/* Interactive Calculator */}
      <EvChargingCalculator key={profile.slug} profile={profile} />

      {/* Mileage Scenario Table */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-900">
          {profile.name} Annual EV vs. Gas Cost by Driving Mileage
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Assumes 3.4 mi/kWh EV efficiency, 28 MPG gas car, 85% home charging at{" "}
          {profile.electricityCentsPerKwh.toFixed(1)}¢/kWh, and 15% public DC fast charging at $
          {profile.publicFastChargePerKwh.toFixed(2)}/kWh.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-4">Annual Mileage</th>
                <th className="py-3 pr-4">100% Home EV</th>
                <th className="py-3 pr-4">85% Home / 15% Public</th>
                <th className="py-3 pr-4">28 MPG Gas Car</th>
                <th className="py-3">Net Annual Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarios.map((row) => {
                const rowPositive = row.annualSavingsVsGas >= 0;
                return (
                  <tr key={row.miles}>
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {row.miles.toLocaleString("en-US")} mi/yr
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(row.annualPureHomeEvCost)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(row.annualBlendedEvCost)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(row.annualGasCost)}
                    </td>
                    <td
                      className={`py-3 font-bold ${
                        rowPositive ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {rowPositive
                        ? `${formatUsd(row.annualSavingsVsGas)}/yr`
                        : `-${formatUsd(Math.abs(row.annualSavingsVsGas))}/yr`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Reference dataset: {DATA_METADATA.sourceLabel} ({DATA_METADATA.baselineVersion}).{" "}
          <Link href="/methodology" className="font-medium text-emerald-700 underline">
            View formulas and assumptions
          </Link>
          .
        </p>
      </section>

      {/* Home Charging Time & Cost (Level 1 vs. Level 2) */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-900">
          Home Charging Time &amp; Cost in {profile.name} (Level 1 vs. Level 2)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Estimated plug-in duration and electricity cost at{" "}
          {profile.electricityCentsPerKwh.toFixed(1)}¢/kWh (including 10% charging loss) for
          typical US daily driving (37 mi ≈ 10.9 battery kWh) and a 20%→80% recharge on a 75 kWh
          battery pack (45 battery kWh).
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-4">Home Charger Tier</th>
                <th className="py-3 pr-4">Daily 37-Mi Top-Up Time</th>
                <th className="py-3 pr-4">Daily Electricity Cost</th>
                <th className="py-3 pr-4">20% → 80% Recharge Time</th>
                <th className="py-3">20% → 80% Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chargingSessions.map((session) => (
                <tr key={session.tier}>
                  <td className="py-3 pr-4 font-semibold text-slate-900">{session.tier}</td>
                  <td className="py-3 pr-4 text-slate-700">
                    {session.dailyHours.toFixed(1)} hrs
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {formatUsd(session.dailyCostUsd, 2)}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {session.topUpHours.toFixed(1)} hrs
                  </td>
                  <td className="py-3 font-semibold text-emerald-700">
                    {formatUsd(session.topUpCostUsd, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Climate & Local Charging Insights */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-900">
          Climate &amp; Local Charging Insights for {profile.name}
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
          <p>{profile.usAvgComparisonNote}</p>
          <p>{getClimateEvNote(profile.climateZone)}</p>
          <p className="text-xs text-slate-500">
            Note: Many local utilities in {profile.name} offer optional overnight Time-of-Use
            (TOU) rates or managed-charging bill credits that lower home charging costs below the
            statewide residential average. Check directly with your electric utility for current
            tariff schedules and active local rebates.
          </p>
        </div>
      </section>

      {/* State FAQs */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">
          Frequently Asked Questions — {profile.name} EV Charging
        </h2>
        <div className="mt-4 space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <h3 className="text-base font-bold text-slate-900">{faq.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related Regional States */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            Compare Nearby {profile.region} States
          </h2>
          <Link
            href="/ev-charging-cost"
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            View all 50 states + DC comparison →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {relatedStates.map((item) => (
            <Link
              key={item.slug}
              href={`/ev-charging-cost/${item.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm hover:border-emerald-500"
            >
              <p className="font-semibold text-slate-900">{item.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.electricityCentsPerKwh.toFixed(1)}¢/kWh
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
