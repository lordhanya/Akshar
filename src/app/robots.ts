import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_BASE_URL || "https://akshar.ashifcodes.tech";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/read-later/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
