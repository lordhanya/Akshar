import type { MetadataRoute } from "next";
import { db } from "@/db";
import { books } from "@/db/schema";
import { desc } from "drizzle-orm";

const BASE_URL = process.env.APP_BASE_URL || "https://akshar.ashifcodes.tech";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/library`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/sign-in`, lastModified: new Date(), changeFrequency: "never", priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "never", priority: 0.3 },
  ];

  const allBooks = await db
    .select({ id: books.id, updatedAt: books.updatedAt })
    .from(books)
    .orderBy(desc(books.updatedAt));

  const bookPages: MetadataRoute.Sitemap = allBooks.map((book) => ({
    url: `${BASE_URL}/books/${book.id}`,
    lastModified: book.updatedAt ? new Date(book.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...bookPages];
}
