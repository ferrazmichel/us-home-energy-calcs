import type { MetadataRoute } from "next";
import { US_STATES_ENERGY } from "@/data/usStatesEnergy";
import { SITE_CONFIG } from "@/lib/siteConfig";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_CONFIG.url}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_CONFIG.url}/ev-charging-cost`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE_CONFIG.url}/heat-pump-vs-gas`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE_CONFIG.url}/methodology`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_CONFIG.url}/about`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_CONFIG.url}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_CONFIG.url}/disclaimer`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const stateRoutes: MetadataRoute.Sitemap = US_STATES_ENERGY.map((st) => ({
    url: `${SITE_CONFIG.url}/ev-charging-cost/${st.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const heatPumpStateRoutes: MetadataRoute.Sitemap = US_STATES_ENERGY.map((st) => ({
    url: `${SITE_CONFIG.url}/heat-pump-vs-gas/${st.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...stateRoutes, ...heatPumpStateRoutes];
}
