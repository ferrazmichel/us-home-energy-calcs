import type { Metadata } from "next";
import Link from "next/link";
import { DATA_METADATA } from "@/data/usStatesEnergy";
import { SITE_CONFIG } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "About",
  description: `Learn how ${SITE_CONFIG.name} builds transparent, no-signup US residential energy calculators grounded in official government benchmarks.`,
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">
        About {SITE_CONFIG.name}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">
        {SITE_CONFIG.name} is an independent library of interactive residential energy cost
        calculators built specifically for US households, commuters, and prospective electric
        vehicle owners.
      </p>

      <div className="mt-8 space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Why No-Signup &amp; Transparent Math Matter
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Many online energy and solar calculators lock simple fuel comparisons behind phone
            numbers, email gates, or lead-generation forms. {SITE_CONFIG.name} runs 100% in your
            browser with open formulas, explicit charging efficiency assumptions, and zero contact
            forms so you can evaluate real operating costs before talking to a dealer or utility.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">Official Benchmark Sources</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>
              <strong>State Utility Rates:</strong> {DATA_METADATA.sourceLabel} (
              {DATA_METADATA.baselineVersion}), tracking residential electricity averages across all
              50 states and Washington, D.C.
            </li>
            <li>
              <strong>Upcoming Solar &amp; HVAC Models:</strong> Planned Phase 2 and Phase 3
              calculators will compare heat pumps against natural gas furnaces using EIA thermal
              series and estimate residential solar payback with NREL PVWatts irradiance benchmarks.
            </li>
          </ul>
          <p className="mt-3 text-sm text-slate-600">
            Review every equation on our{" "}
            <Link href="/methodology" className="font-semibold text-emerald-700 underline">
              Methodology &amp; Data Sources
            </Link>{" "}
            page.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Editorial Independence &amp; Support
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            To keep these tools free without subscriptions or email gates, {SITE_CONFIG.name} may
            display third-party advertisements and clearly disclosed affiliate links to home
            charging hardware or energy monitors. Advertising partners never influence our state
            utility benchmarks or calculation formulas.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">Contact</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Found a bug, outdated utility benchmark, or calculation suggestion? Email us at{" "}
            <a
              href={`mailto:${SITE_CONFIG.contactEmail}`}
              className="font-semibold text-emerald-700 underline"
            >
              {SITE_CONFIG.contactEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

