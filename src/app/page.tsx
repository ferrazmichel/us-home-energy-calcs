import Link from "next/link";
import EvChargingCalculator from "@/components/EvChargingCalculator";
import {
  DATA_METADATA,
  US_NATIONAL_AVERAGE,
  US_STATES_ENERGY,
} from "@/data/usStatesEnergy";

export default function HomePage() {
  const sortedStates = [...US_STATES_ENERGY].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
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
      <EvChargingCalculator profile={US_NATIONAL_AVERAGE} />

      {/* Upcoming Tools Preview */}
      <section className="mt-12 grid gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Live Now
          </span>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            EV Home Charging Cost by State
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            State-specific residential ¢/kWh rates, gas comparisons, eGallon equivalent, and 5-year fuel savings.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Phase 2 Roadmap
          </span>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Heat Pump vs. Gas Furnace
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Climate-zone heating operating cost comparison using residential electricity vs. natural gas per therm.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Phase 3 Roadmap
          </span>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Residential Solar Payback
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            State net-billing economics and solar irradiance modeling powered by NREL PVWatts benchmarks.
          </p>
        </div>
      </section>

      {/* Browse All 50 States + DC */}
      <section id="states" className="mt-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              EV Home Charging Cost by US State
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Select your state to open a pre-loaded calculator with local electricity and gas benchmarks.
            </p>
          </div>
          <p className="text-xs text-slate-500">Source: {DATA_METADATA.sourceLabel}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sortedStates.map((st) => (
            <Link
              key={st.slug}
              href={`/ev-charging-cost/${st.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-emerald-500 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 group-hover:text-emerald-700">
                  {st.name}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                  {st.abbr}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {st.electricityCentsPerKwh.toFixed(1)}¢/kWh · ${st.gasPricePerGallon.toFixed(2)}/gal
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
