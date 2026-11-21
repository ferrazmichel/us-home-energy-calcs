import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SolarPaybackCalculator from "@/components/SolarPaybackCalculator";
import StateQuickSwitcher from "@/components/StateQuickSwitcher";
import {
  DATA_METADATA,
  getClimateSolarNote,
  getRelatedStates,
  getStateBySlug,
  US_NATIONAL_AVERAGE,
  US_STATES_ENERGY,
} from "@/data/usStatesEnergy";
import {
  calculateSolarPayback,
  DEFAULT_SOLAR_ASSUMPTIONS,
  formatUsd,
  SOLAR_SIZE_PRESETS,
} from "@/lib/calculators";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getStateSolarRankingBySlug } from "@/lib/stateRankings";

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

  const baseline = calculateSolarPayback({
    systemSizeKw: DEFAULT_SOLAR_ASSUMPTIONS.systemSizeKw,
    electricityCentsPerKwh: profile.electricityCentsPerKwh,
    peakSunHours: profile.peakSunHours,
    monthlyElectricBillUsd: DEFAULT_SOLAR_ASSUMPTIONS.monthlyElectricBillUsd,
    installCostPerWattUsd: DEFAULT_SOLAR_ASSUMPTIONS.installCostPerWattUsd,
    incentivePercent: DEFAULT_SOLAR_ASSUMPTIONS.incentivePercent,
  });

  const title = `Solar Panel Payback Period & Savings in ${profile.name} (Calculator)`;
  const description = `At ${profile.electricityCentsPerKwh.toFixed(1)}¢/kWh electricity and ${profile.peakSunHours.toFixed(1)} peak sun hours/day, an 8 kW rooftop solar system in ${profile.name} generates ~${Math.round(baseline.annualProductionKwh).toLocaleString("en-US")} kWh/yr with a ${baseline.simplePaybackYears.toFixed(1)}-year simple payback and ${formatUsd(baseline.twentyFiveYearNetProfitUsd)} 25-year net savings.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/solar-payback/${profile.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/solar-payback/${profile.slug}`,
      type: "article",
    },
  };
}

export default async function StateSolarPaybackPage({ params }: StatePageProps) {
  const { state: slug } = await params;
  const profile = getStateBySlug(slug);

  if (!profile) {
    notFound();
  }

  const ranking = getStateSolarRankingBySlug(profile.slug);

  const scenarios = SOLAR_SIZE_PRESETS.map((preset) => ({
    label: preset.label,
    ...calculateSolarPayback({
      systemSizeKw: preset.value,
      electricityCentsPerKwh: profile.electricityCentsPerKwh,
      peakSunHours: profile.peakSunHours,
      monthlyElectricBillUsd: DEFAULT_SOLAR_ASSUMPTIONS.monthlyElectricBillUsd,
      installCostPerWattUsd: DEFAULT_SOLAR_ASSUMPTIONS.installCostPerWattUsd,
      incentivePercent: DEFAULT_SOLAR_ASSUMPTIONS.incentivePercent,
    }),
  }));

  const defaultScenario = scenarios[1];

  const sunDiffPct =
    ((profile.peakSunHours - US_NATIONAL_AVERAGE.peakSunHours) /
      US_NATIONAL_AVERAGE.peakSunHours) *
    100;
  const sunDiffLabel =
    Math.abs(sunDiffPct) < 2
      ? "near the US national average"
      : sunDiffPct > 0
      ? `${sunDiffPct.toFixed(0)}% above the US average`
      : `${Math.abs(sunDiffPct).toFixed(0)}% below the US average`;

  const relatedStates = getRelatedStates(profile, 6);
  const switcherStates = US_STATES_ENERGY.map((st) => ({
    slug: st.slug,
    name: st.name,
    abbr: st.abbr,
  }));

  const faqs = [
    {
      question: `How long does it take for solar panels to pay for themselves in ${profile.name}?`,
      answer: `Using ${profile.name}'s baseline electricity rate of ${profile.electricityCentsPerKwh.toFixed(1)}¢/kWh and ${profile.peakSunHours.toFixed(1)} peak sun hours/day, an 8 kW system ($22,800 gross at $2.85/W without subsidies) generates ~${Math.round(defaultScenario.annualProductionKwh).toLocaleString("en-US")} kWh/yr and reaches simple payback in roughly ${defaultScenario.simplePaybackYears.toFixed(1)} years. State or utility rebates shorten this timeline proportionally.`,
    },
    {
      question: `How much electricity does an 8 kW solar system produce in ${profile.name}?`,
      answer: `Assuming ${profile.peakSunHours.toFixed(1)} daily peak sun hours and an 80% DC-to-AC performance ratio, an 8 kW residential solar array in ${profile.name} produces approximately ${Math.round(defaultScenario.annualProductionKwh).toLocaleString("en-US")} kWh per year (~${Math.round(defaultScenario.monthlyProductionKwh).toLocaleString("en-US")} kWh/month), saving about ${formatUsd(defaultScenario.firstYearSavingsUsd)} in Year-1 electricity bills.`,
    },
    {
      question: `Is going solar worth it in ${profile.name} over 25 years?`,
      answer: `Over a 25-year panel warrantied lifespan (accounting for 0.5%/yr degradation and 2.5%/yr utility inflation), the effective locked-in solar rate is ${defaultScenario.levelizedSolarCentsPerKwh.toFixed(1)}¢/kWh compared with ${profile.electricityCentsPerKwh.toFixed(1)}¢/kWh retail grid power—producing an estimated ${formatUsd(defaultScenario.twentyFiveYearNetProfitUsd)} in cumulative net savings.`,
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
        name: "Solar Payback",
        item: `${SITE_CONFIG.url}/solar-payback`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: profile.name,
        item: `${SITE_CONFIG.url}/solar-payback/${profile.slug}`,
      },
    ],
  };

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
          <Link href="/solar-payback" className="hover:text-emerald-700">
            Solar Payback
          </Link>{" "}
          <span className="mx-1">/</span>
          <span className="text-slate-800">{profile.name}</span>
        </nav>

        <StateQuickSwitcher
          currentSlug={profile.slug}
          states={switcherStates}
          basePath="/solar-payback"
        />
      </div>

      {/* Header */}
      <header className="mb-8 max-w-4xl">
        {ranking ? (
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              #{ranking.sunRank} of {ranking.totalStates} peak sun hours ({profile.peakSunHours.toFixed(1)} hrs/day)
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              #{ranking.paybackRank} of {ranking.totalStates} fastest solar payback in US
            </span>
          </div>
        ) : null}

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Residential Solar Payback Period in {profile.name}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          {profile.name} averages{" "}
          <strong className="font-semibold text-slate-900">
            {profile.peakSunHours.toFixed(1)} peak sun hours/day
          </strong>{" "}
          ({sunDiffLabel}) and a residential electricity rate of{" "}
          <strong className="font-semibold text-slate-900">
            {profile.electricityCentsPerKwh.toFixed(1)}¢/kWh
          </strong>
          . Adjust system size, installation cost per watt, and utility incentives below to model
          your exact payback timeline.
        </p>
      </header>

      {/* Snapshot KPI Cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">{profile.abbr} Peak Sun Hours</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {profile.peakSunHours.toFixed(1)} hrs/day
          </p>
          <p className="mt-1 text-xs text-slate-500">
            US Avg: {US_NATIONAL_AVERAGE.peakSunHours.toFixed(1)} hrs/day
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">8 kW Annual Output</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {Math.round(defaultScenario.annualProductionKwh).toLocaleString("en-US")} kWh
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Saves {formatUsd(defaultScenario.firstYearSavingsUsd)} in Year 1
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Simple Payback (8 kW)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {defaultScenario.simplePaybackYears.toFixed(1)} years
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Solar LCOE: {defaultScenario.levelizedSolarCentsPerKwh.toFixed(1)}¢/kWh
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Est. 25-Year Net Profit</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              defaultScenario.twentyFiveYearNetProfitUsd >= 0
                ? "text-emerald-700"
                : "text-amber-700"
            }`}
          >
            {defaultScenario.twentyFiveYearNetProfitUsd >= 0
              ? `+${formatUsd(defaultScenario.twentyFiveYearNetProfitUsd)}`
              : `-${formatUsd(Math.abs(defaultScenario.twentyFiveYearNetProfitUsd))}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">After $22,800 gross capex</p>
        </div>
      </section>

      {/* Interactive Calculator */}
      <SolarPaybackCalculator key={`${profile.slug}-solar`} profile={profile} />

      {/* System Size Scenario Table */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-900">
          {profile.name} Solar Cost &amp; Payback by System Size ($2.85/W Baseline)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Compares 6 kW, 8 kW, and 10 kW rooftop solar arrays at {profile.name}&apos;s{" "}
          {profile.electricityCentsPerKwh.toFixed(1)}¢/kWh retail rate and{" "}
          {profile.peakSunHours.toFixed(1)} daily peak sun hours.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-4">System Size</th>
                <th className="py-3 pr-4">Installed Cost</th>
                <th className="py-3 pr-4">Year-1 Output</th>
                <th className="py-3 pr-4">Year-1 Savings</th>
                <th className="py-3 pr-4">Simple Payback</th>
                <th className="py-3">25-Yr Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarios.map((row) => {
                const rowPositive = row.twentyFiveYearNetProfitUsd >= 0;
                return (
                  <tr key={row.label}>
                    <td className="py-3 pr-4 font-semibold text-slate-900">{row.label}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(row.netSystemCostUsd)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {Math.round(row.annualProductionKwh).toLocaleString("en-US")} kWh/yr
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(row.firstYearSavingsUsd)}/yr
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {row.simplePaybackYears.toFixed(1)} yrs
                    </td>
                    <td
                      className={`py-3 font-bold ${
                        rowPositive ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {rowPositive
                        ? `+${formatUsd(row.twentyFiveYearNetProfitUsd)}`
                        : `-${formatUsd(Math.abs(row.twentyFiveYearNetProfitUsd))}`}
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
            View solar PV formulas and assumptions
          </Link>
          .
        </p>
      </section>

      {/* Climate & Net Billing Insights */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-900">
          Solar Production &amp; Net-Billing Insights for {profile.name}
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
          <p>{getClimateSolarNote(profile.climateZone)}</p>
          <p className="text-xs text-slate-500">
            Note: Self-consuming solar power directly (such as daytime EV charging or pre-cooling
            with a heat pump) always preserves full retail utility value per kWh even in states
            with reduced export credits.
          </p>
        </div>
      </section>

      {/* Cross-links to EV & Heat Pump Pages */}
      <section className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Pair Solar with Electrification in {profile.name}
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Compare EV Charging &amp; Heat Pump Savings in {profile.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            See how locked-in {defaultScenario.levelizedSolarCentsPerKwh.toFixed(1)}¢/kWh solar
            power improves home EV charging and heat pump operating economics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/ev-charging-cost/${profile.slug}`}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            {profile.abbr} EV Calculator →
          </Link>
          <Link
            href={`/heat-pump-vs-gas/${profile.slug}`}
            className="rounded-lg border border-emerald-600 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            {profile.abbr} Heat Pump Calculator →
          </Link>
        </div>
      </section>

      {/* State FAQs */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">
          Frequently Asked Questions — {profile.name} Solar Payback
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
            href="/solar-payback"
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            View all 50 states + DC comparison →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {relatedStates.map((item) => (
            <Link
              key={item.slug}
              href={`/solar-payback/${item.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm hover:border-emerald-500"
            >
              <p className="font-semibold text-slate-900">{item.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.peakSunHours.toFixed(1)} sun hrs
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
