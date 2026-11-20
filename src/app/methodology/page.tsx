import type { Metadata } from "next";
import { DATA_METADATA, US_NATIONAL_AVERAGE } from "@/data/usStatesEnergy";

export const metadata: Metadata = {
  title: "Methodology & Data Sources",
  description:
    "Exact formulas, charging efficiency assumptions, and US Energy Information Administration (EIA) data sources powering HomeEnergyCalcs.",
  alternates: {
    canonical: "/methodology",
  },
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">
        Methodology &amp; Data Sources
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">
        HomeEnergyCalcs provides transparent, non-gated energy operating cost estimates so US
        households can model real-world numbers without submitting personal contact information.
      </p>

      <div className="mt-8 space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">1. EV Charging Cost Formula</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Electric vehicles consume electricity from the wall outlet rather than strictly
            what enters the battery pack. Level 2 AC home charging typically achieves around
            88% to 92% wall-to-battery efficiency. Our calculator applies a conservative{" "}
            <strong>90% charging efficiency factor</strong> by default:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
{`Annual Grid Electricity (kWh) = (Annual Miles / EV Efficiency [mi/kWh]) / 0.90
Home Charging Cost ($)       = Annual Grid Electricity × (Home Rate [¢/kWh] / 100)
Gasoline Cost ($)            = (Annual Miles / Gas Vehicle MPG) × Gas Price ($/gal)`}
          </pre>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">2. Blended Home &amp; Public Charging</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Most US EV households charge 80% to 90% of annual miles at home and rely on public
            DC fast chargers (DCFC) during road trips. The default split is set to{" "}
            <strong>85% home / 15% public</strong> and can be adjusted anywhere from 0% to 100%.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">3. Baseline State Rates &amp; Benchmarks</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>
              <strong>Electricity Pricing:</strong> {DATA_METADATA.sourceLabel} (
              {DATA_METADATA.baselineVersion}), with a US national baseline of{" "}
              {US_NATIONAL_AVERAGE.electricityCentsPerKwh.toFixed(1)}¢/kWh.
            </li>
            <li>
              <strong>Important Local Variance:</strong> Utility tariffs vary within each
              state depending on investor-owned utilities, municipal providers, tiered usage,
              and optional EV Time-of-Use (TOU) off-peak plans. Enter your exact bill rate in
              the calculator input for maximum accuracy.
            </li>
            <li>
              <strong>Tax Credits &amp; Rebates Policy:</strong> Because federal residential
              energy and EV tax incentives change by legislation (including recent 2025/2026
              sunsets), our calculators focus on direct energy operating savings and never
              assume expired federal tax credits automatically.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
