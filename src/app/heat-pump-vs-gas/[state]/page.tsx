import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import HeatPumpCalculator from "@/components/HeatPumpCalculator";
import StateQuickSwitcher from "@/components/StateQuickSwitcher";
import {
  DATA_METADATA,
  getClimateHeatPumpNote,
  getDefaultHeatingMMBtu,
  getRelatedStates,
  getStateBySlug,
  US_NATIONAL_AVERAGE,
  US_STATES_ENERGY,
} from "@/data/usStatesEnergy";
import {
  calculateHeatPumpVsGasCosts,
  DEFAULT_HEAT_PUMP_ASSUMPTIONS,
  formatUsd,
} from "@/lib/calculators";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { getStateHeatPumpRankingBySlug } from "@/lib/stateRankings";

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

  const heatingMMBtu = getDefaultHeatingMMBtu(profile.climateZone);
  const baseline = calculateHeatPumpVsGasCosts({
    annualHeatingMMBtu: heatingMMBtu,
    electricityCentsPerKwh: profile.electricityCentsPerKwh,
    naturalGasDollarsPerTherm: profile.naturalGasPerTherm,
    heatPumpHspf2: DEFAULT_HEAT_PUMP_ASSUMPTIONS.heatPumpHspf2,
    furnaceAfuePercent: DEFAULT_HEAT_PUMP_ASSUMPTIONS.furnaceAfuePercent,
  });

  const title = `Heat Pump vs. Gas Furnace Running Cost in ${profile.name} (Calculator & Rates)`;
  const comparisonSummary =
    baseline.annualSavingsVsGas >= 0
      ? `saves ~${formatUsd(baseline.annualSavingsVsGas)}/yr vs. an 85% AFUE gas furnace`
      : `costs ~${formatUsd(Math.abs(baseline.annualSavingsVsGas))}/yr more than gas (break-even COP ${baseline.breakEvenCop.toFixed(2)})`;
  const description = `At ${profile.electricityCentsPerKwh.toFixed(1)}¢/kWh electricity and $${profile.naturalGasPerTherm.toFixed(2)}/therm natural gas, a 9.5 HSPF2 heat pump in ${profile.name} ${comparisonSummary} while saving ${formatUsd(baseline.annualSavingsVsResistance)}/yr vs. electric resistance heat.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/heat-pump-vs-gas/${profile.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/heat-pump-vs-gas/${profile.slug}`,
      type: "article",
    },
  };
}

export default async function StateHeatPumpPage({ params }: StatePageProps) {
  const { state: slug } = await params;
  const profile = getStateBySlug(slug);

  if (!profile) {
    notFound();
  }

  const ranking = getStateHeatPumpRankingBySlug(profile.slug);
  const baseMMBtu = getDefaultHeatingMMBtu(profile.climateZone);

  const homeSizes = [
    { label: "Small Home / Condo (1,400 sq ft)", mmbtu: Math.max(10, Math.round(baseMMBtu * 0.7)) },
    { label: "Typical Home (2,000 sq ft)", mmbtu: baseMMBtu },
    { label: "Large Home (2,800 sq ft)", mmbtu: Math.round(baseMMBtu * 1.4) },
  ];

  const scenarios = homeSizes.map((size) => ({
    label: size.label,
    ...calculateHeatPumpVsGasCosts({
      annualHeatingMMBtu: size.mmbtu,
      electricityCentsPerKwh: profile.electricityCentsPerKwh,
      naturalGasDollarsPerTherm: profile.naturalGasPerTherm,
      heatPumpHspf2: DEFAULT_HEAT_PUMP_ASSUMPTIONS.heatPumpHspf2,
      furnaceAfuePercent: DEFAULT_HEAT_PUMP_ASSUMPTIONS.furnaceAfuePercent,
    }),
  }));

  const defaultScenario = scenarios[1];
  const hpWinsGas = defaultScenario.annualSavingsVsGas >= 0;

  const gasDiffPct =
    ((profile.naturalGasPerTherm - US_NATIONAL_AVERAGE.naturalGasPerTherm) /
      US_NATIONAL_AVERAGE.naturalGasPerTherm) *
    100;
  const gasDiffLabel =
    Math.abs(gasDiffPct) < 2
      ? "near the US average"
      : gasDiffPct > 0
      ? `${gasDiffPct.toFixed(0)}% above the US average`
      : `${Math.abs(gasDiffPct).toFixed(0)}% below the US average`;

  const relatedStates = getRelatedStates(profile, 6);
  const switcherStates = US_STATES_ENERGY.map((st) => ({
    slug: st.slug,
    name: st.name,
    abbr: st.abbr,
  }));

  const faqs = [
    {
      question: `Is a heat pump cheaper to run than a gas furnace in ${profile.name}?`,
      answer: hpWinsGas
        ? `Yes, at ${profile.name}'s baseline rates (${profile.electricityCentsPerKwh.toFixed(1)}¢/kWh and $${profile.naturalGasPerTherm.toFixed(2)}/therm), an ENERGY STAR 9.5 HSPF2 heat pump saves roughly ${formatUsd(defaultScenario.annualSavingsVsGas)}/year compared with an 85% AFUE gas furnace for a typical ${baseMMBtu} MMBtu home.`
        : `At standard flat utility rates (${profile.electricityCentsPerKwh.toFixed(1)}¢/kWh vs. $${profile.naturalGasPerTherm.toFixed(2)}/therm), an 85% AFUE gas furnace currently runs about ${formatUsd(Math.abs(defaultScenario.annualSavingsVsGas))}/year less than a 9.5 HSPF2 heat pump. To beat natural gas purely on operating cost in ${profile.name}, a heat pump needs a seasonal COP above ${defaultScenario.breakEvenCop.toFixed(2)} (${defaultScenario.breakEvenHspf2.toFixed(1)} HSPF2) or pairing with rooftop solar.`,
    },
    {
      question: `What heat pump efficiency (COP / HSPF2) breaks even with natural gas in ${profile.name}?`,
      answer: `Using ${profile.name}'s baseline residential utility rates and an 85% AFUE reference furnace, the fuel-cost break-even point is ${defaultScenario.breakEvenHspf2.toFixed(1)} HSPF2 (seasonal COP of ${defaultScenario.breakEvenCop.toFixed(2)}). Whenever your heat pump operates above COP ${defaultScenario.breakEvenCop.toFixed(2)}, it costs less per BTU delivered than burning natural gas.`,
    },
    {
      question: `How much does a heat pump save over electric baseboard heat in ${profile.name}?`,
      answer: `Switching from 100%-efficient (1.0 COP) electric baseboard or resistance furnace heat to a 9.5 HSPF2 (2.78 COP) heat pump reduces heating electricity usage by roughly 64%, saving an estimated ${formatUsd(defaultScenario.annualSavingsVsResistance)}/year (${formatUsd(defaultScenario.fiveYearSavingsVsResistance)} over 5 years) at ${profile.name}'s ${profile.electricityCentsPerKwh.toFixed(1)}¢/kWh rate.`,
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
        name: "Heat Pump vs. Gas Furnace",
        item: `${SITE_CONFIG.url}/heat-pump-vs-gas`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: profile.name,
        item: `${SITE_CONFIG.url}/heat-pump-vs-gas/${profile.slug}`,
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
          <Link href="/heat-pump-vs-gas" className="hover:text-emerald-700">
            Heat Pump vs. Gas
          </Link>{" "}
          <span className="mx-1">/</span>
          <span className="text-slate-800">{profile.name}</span>
        </nav>

        <StateQuickSwitcher
          currentSlug={profile.slug}
          states={switcherStates}
          basePath="/heat-pump-vs-gas"
        />
      </div>

      {/* Header */}
      <header className="mb-8 max-w-4xl">
        {ranking ? (
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 capitalize">
              {profile.climateZone} climate zone · {baseMMBtu} MMBtu/yr baseline
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              #{ranking.heatPumpSavingsRank} of {ranking.totalStates} heat pump advantage vs. gas
            </span>
          </div>
        ) : null}

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Heat Pump vs. Gas Furnace Operating Cost in {profile.name}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          {profile.name}&apos;s baseline residential natural gas rate is{" "}
          <strong className="font-semibold text-slate-900">
            ${profile.naturalGasPerTherm.toFixed(2)}/therm
          </strong>{" "}
          ({gasDiffLabel}), compared with{" "}
          <strong className="font-semibold text-slate-900">
            {profile.electricityCentsPerKwh.toFixed(1)}¢/kWh
          </strong>{" "}
          for residential electricity. Enter your utility rates and home heating load below to
          model your exact winter operating costs.
        </p>
      </header>

      {/* Snapshot KPI Cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">
            {profile.abbr} Electricity &amp; Gas
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {profile.electricityCentsPerKwh.toFixed(1)}¢ · ${profile.naturalGasPerTherm.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-500">¢/kWh vs. $/therm residential rate</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Cost per Delivered MMBtu</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatUsd(defaultScenario.costPerMMBtuHeatPump, 2)} vs.{" "}
            {formatUsd(defaultScenario.costPerMMBtuGas, 2)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Heat pump (9.5 HSPF2) vs. 85% gas</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Break-Even Efficiency</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            COP {defaultScenario.breakEvenCop.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Equal to {defaultScenario.breakEvenHspf2.toFixed(1)} HSPF2 vs. 85% AFUE
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Est. Annual Savings vs. Gas</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              hpWinsGas ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {hpWinsGas
              ? `+${formatUsd(defaultScenario.annualSavingsVsGas)}/yr`
              : `-${formatUsd(Math.abs(defaultScenario.annualSavingsVsGas))}/yr`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Saves {formatUsd(defaultScenario.annualSavingsVsResistance)}/yr vs. resistance
          </p>
        </div>
      </section>

      {/* Interactive Calculator */}
      <HeatPumpCalculator key={`${profile.slug}-hp`} profile={profile} />

      {/* Home Size Scenario Table */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-900">
          {profile.name} Annual Heating Cost by Home Size ({profile.climateZone} climate)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Compares a cold-climate 9.5 HSPF2 air-source heat pump, an 85% AFUE natural gas
          furnace, and 1.0 COP electric resistance heating at {profile.name}&apos;s baseline
          rates.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-4">Home Size &amp; Load</th>
                <th className="py-3 pr-4">Heat Pump (9.5 HSPF2)</th>
                <th className="py-3 pr-4">Gas Furnace (85% AFUE)</th>
                <th className="py-3 pr-4">Electric Baseboard</th>
                <th className="py-3">Heat Pump vs. Gas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarios.map((row) => {
                const rowPositive = row.annualSavingsVsGas >= 0;
                return (
                  <tr key={row.label}>
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {row.label} ({row.annualHeatingMMBtu} MMBtu)
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(row.annualHeatPumpCost)}/yr
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(row.annualGasFurnaceCost)}/yr
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {formatUsd(row.annualElectricResistanceCost)}/yr
                    </td>
                    <td
                      className={`py-3 font-bold ${
                        rowPositive ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {rowPositive
                        ? `+${formatUsd(row.annualSavingsVsGas)}/yr saved`
                        : `Gas -$${Math.abs(Math.round(row.annualSavingsVsGas))}/yr`}
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
            View thermodynamic formulas and assumptions
          </Link>
          .
        </p>
      </section>

      {/* Climate Insights */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold text-slate-900">
          Climate &amp; Dual-Fuel Insights for {profile.name}
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
          <p>{getClimateHeatPumpNote(profile.climateZone)}</p>
          <p className="text-xs text-slate-500">
            Note: Homeowners switching away from gas entirely also eliminate year-round fixed
            monthly gas utility connection fees ($15–$30/mo in many markets), which adds $180–$360
            in annual savings not included in fuel-only operating figures above.
          </p>
        </div>
      </section>

      {/* Cross-link to EV Charging Page */}
      <section className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            More {profile.name} Energy Tools
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Charging an Electric Car at Home in {profile.name}?
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Compare {profile.electricityCentsPerKwh.toFixed(1)}¢/kWh overnight home EV charging
            against ${profile.gasPricePerGallon.toFixed(2)}/gal gasoline.
          </p>
        </div>
        <Link
          href={`/ev-charging-cost/${profile.slug}`}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          Open {profile.abbr} EV Charging Calculator →
        </Link>
      </section>

      {/* State FAQs */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">
          Frequently Asked Questions — {profile.name} Heat Pumps
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
            href="/heat-pump-vs-gas"
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            View all 50 states + DC comparison →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {relatedStates.map((item) => (
            <Link
              key={item.slug}
              href={`/heat-pump-vs-gas/${item.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm hover:border-emerald-500"
            >
              <p className="font-semibold text-slate-900">{item.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                ${item.naturalGasPerTherm.toFixed(2)}/therm
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
