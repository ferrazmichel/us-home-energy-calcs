import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `Informational and financial estimation disclaimer for ${SITE_CONFIG.name}.`,
  alternates: {
    canonical: "/disclaimer",
  },
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Disclaimer</h1>

      <div className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-600">
        <section>
          <h2 className="text-lg font-bold text-slate-900">Informational Estimates Only</h2>
          <p className="mt-2">
            All calculators and state averages published on {SITE_CONFIG.name} are provided
            strictly for informational and educational comparison purposes. Actual home
            electricity bills, gasoline prices, vehicle efficiency in extreme temperatures,
            and charging losses vary by utility provider, time-of-use schedule, driving
            habits, and equipment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">No Financial, Tax, or Engineering Advice</h2>
          <p className="mt-2">
            Nothing on this website constitutes financial, legal, tax, or licensed electrical
            engineering advice. Always confirm utility tariffs, local permitting, and current
            federal, state, or utility incentive rules directly with your electric utility,
            licensed contractor, or qualified tax advisor before making purchase decisions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">
            Advertising &amp; Affiliate Disclosure
          </h2>
          <p className="mt-2">
            {SITE_CONFIG.name} is free to use and may be supported by display advertising and
            affiliate links (including Amazon Associates links for qualifying home EV chargers and
            energy monitors). If you purchase a product through an affiliate link, we may earn a
            commission at no additional cost to you. Advertising and affiliate relationships never
            alter our utility datasets or calculator results.
          </p>
        </section>
      </div>
    </div>
  );
}
