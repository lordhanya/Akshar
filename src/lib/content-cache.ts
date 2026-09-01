import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { bookContent } from "@/db/schema";
import type { BookContent, BookContentSection } from "@/providers/types";

/**
 * Content cache — the narrow persistence interface for normalized content.
 *
 * The rest of the app (providers, and later the reader) talks only to this
 * module. The backing store today is Neon Postgres (`book_content`), but the
 * interface is deliberately storage-agnostic so it can move to object storage
 * (Neon Object Storage / S3 / R2) without touching caller code: `sections` is
 * the single normalized blob either way.
 *
 * Small normalized books fit comfortably in the Neon free tier, so a DB-backed
 * cache is appropriate until volumes grow.
 */

const COLUMNS = {
  bookId: bookContent.bookId,
  language: bookContent.language,
  sections: bookContent.sections,
  sourceUrl: bookContent.sourceUrl,
  sourceSha256: bookContent.sourceSha256,
  wordCount: bookContent.wordCount,
  cachedAt: bookContent.cachedAt,
} as const;

/** Fetch cached content for a book, or null when absent. */
export async function getCachedContent(bookId: string): Promise<BookContent | null> {
  const rows = await db
    .select(COLUMNS)
    .from(bookContent)
    .where(eq(bookContent.bookId, bookId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return normalizeRow(row);
}

function normalizeRow(
  row: {
    bookId: string;
    language: string;
    sections: unknown;
    sourceUrl: string | null;
    sourceSha256: string | null;
    wordCount: number | null;
  }
): BookContent {
  return {
    bookId: row.bookId,
    language: row.language,
    sections: Array.isArray(row.sections) ? (row.sections as BookContentSection[]) : [],
    sourceUrl: row.sourceUrl,
    wordCount: row.wordCount ?? undefined,
  };
}

/** Persist (upsert) normalized content for a book. */
export async function setCachedContent(
  bookId: string,
  content: BookContent
): Promise<void> {
  await db
    .insert(bookContent)
    .values({
      bookId,
      language: content.language,
      sections: content.sections,
      sourceUrl: content.sourceUrl ?? null,
      wordCount: content.wordCount ?? null,
    })
    .onConflictDoUpdate({
      target: bookContent.bookId,
      set: {
        language: content.language,
        sections: content.sections,
        sourceUrl: content.sourceUrl ?? null,
        wordCount: content.wordCount ?? null,
        cachedAt: new Date(),
      },
    });
}

/** Remove a book's cached content (e.g. a rights revocation). */
export async function deleteCachedContent(bookId: string): Promise<void> {
  await db.delete(bookContent).where(eq(bookContent.bookId, bookId));
}

/** Number of cached content records (used in verification/seeding). */
export async function countCachedContent(): Promise<number> {
  const rows = await db.select({ value: count() }).from(bookContent);
  return rows[0]?.value ?? 0;
}
