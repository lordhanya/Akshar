import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Akshar — a calm place to read",
    short_name: "Akshar",
    description:
      "A calm, free digital reading room with strong book discovery and regional-language support.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#171717",
    orientation: "portrait-primary",
    categories: ["books", "education", "reading"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
