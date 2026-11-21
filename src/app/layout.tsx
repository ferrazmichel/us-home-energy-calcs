import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { SITE_CONFIG } from "@/lib/siteConfig";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} — US Home EV, Heat Pump & Solar Cost Calculators`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description:
    "Free, data-transparent US home energy calculators using state utility pricing to compare EV home charging, gasoline, heat pumps, and residential solar savings.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_CONFIG.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {SITE_CONFIG.googleTagId || SITE_CONFIG.adsenseClient ? (
        <head>
          {SITE_CONFIG.googleTagId ? (
            <>
              {/* eslint-disable-next-line @next/next/next-script-for-ga */}
              <script
                async
                src={`https://www.googletagmanager.com/gtm.js?id=${SITE_CONFIG.googleTagId}`}
              />
              {/* eslint-disable-next-line @next/next/next-script-for-ga */}
              <script
                dangerouslySetInnerHTML={{
                  __html:
                    "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date());",
                }}
              />
            </>
          ) : null}
          {SITE_CONFIG.adsenseClient ? (
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE_CONFIG.adsenseClient}`}
              crossOrigin="anonymous"
            />
          ) : null}
        </head>
      ) : null}
      <body className="min-h-screen flex flex-col">
        {!SITE_CONFIG.googleTagId && SITE_CONFIG.gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${SITE_CONFIG.gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${SITE_CONFIG.gaMeasurementId}');
              `}
            </Script>
          </>
        ) : null}

        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                HW
              </span>
              <span>{SITE_CONFIG.name}</span>
            </Link>

            <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
              <Link
                href="/ev-charging-cost"
                className="hover:text-emerald-700 transition-colors"
              >
                EV Charging
              </Link>
              <Link
                href="/heat-pump-vs-gas"
                className="hover:text-emerald-700 transition-colors"
              >
                Heat Pump vs. Gas
              </Link>
              <Link
                href="/methodology"
                className="hover:text-emerald-700 transition-colors"
              >
                Methodology
              </Link>
              <Link
                href="/about"
                className="hover:text-emerald-700 transition-colors"
              >
                About
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="font-medium text-slate-700">
                {SITE_CONFIG.name} — Transparent US Residential Energy Tools
              </p>
              <p className="mt-1 text-xs text-slate-500">
                © 2026 {SITE_CONFIG.name}. Estimates based on US Energy Information
                Administration (EIA) baseline residential rates.
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-xs font-medium text-slate-600">
              <Link href="/ev-charging-cost" className="hover:text-emerald-700">
                EV Charging by State
              </Link>
              <Link href="/heat-pump-vs-gas" className="hover:text-emerald-700">
                Heat Pump vs. Gas
              </Link>
              <Link href="/methodology" className="hover:text-emerald-700">
                Methodology &amp; Data
              </Link>
              <Link href="/about" className="hover:text-emerald-700">
                About
              </Link>
              <Link href="/privacy-policy" className="hover:text-emerald-700">
                Privacy Policy
              </Link>
              <Link href="/disclaimer" className="hover:text-emerald-700">
                Disclaimer
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
