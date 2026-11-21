export const SITE_CONFIG = {
  name: "HomeEnergyCalcs",
  tagline: "US Home Energy & EV Cost Calculators",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://homeenergycalcs.com").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@homeenergycalcs.com",
  googleTagId: process.env.NEXT_PUBLIC_GOOGLE_TAG_ID || "GTM-KLKPB4WP",
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
} as const;
