export const SITE_CONFIG = {
  name: "HomeWattCalc",
  tagline: "US Home Energy & EV Cost Calculators",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://homewattcalc.com").replace(/\/$/, ""),
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
} as const;
