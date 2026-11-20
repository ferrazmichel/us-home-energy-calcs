import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy and data handling practices for ${SITE_CONFIG.name}.`,
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-xs text-slate-500">Effective Date: November 19, 2026</p>

      <div className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-600">
        <section>
          <h2 className="text-lg font-bold text-slate-900">1. No Account or Personal Inputs Stored</h2>
          <p className="mt-2">
            {SITE_CONFIG.name} runs all calculator math locally in your browser. We do not
            require registration, email addresses, phone numbers, or utility account logins to
            view results.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">2. Analytics &amp; Advertising Cookies</h2>
          <p className="mt-2">
            We may use privacy-respecting web analytics (such as Google Analytics 4) to
            measure aggregate page traffic and improve our tools. When advertising partners
            (such as Google AdSense or Mediavine Journey) or affiliate links (such as Amazon
            Associates) are active, third-party vendors may use cookies or similar
            technologies to serve relevant ads or attribute qualifying referrals in accordance
            with applicable privacy laws.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">3. Your Choices</h2>
          <p className="mt-2">
            You may disable cookies at any time through your browser settings or manage
            personalized advertising preferences via Google&apos;s Ads Settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900">4. Contact &amp; US Privacy Notice</h2>
          <p className="mt-2">
            Because we do not create user accounts or sell personal profiles, we do not store
            calculator inputs on our servers. If you have questions about this Privacy Policy or
            applicable US state privacy rights, contact us at{" "}
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
