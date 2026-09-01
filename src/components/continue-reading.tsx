import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { BookOpen } from "lucide-react";
import { db } from "@/db";
import { readingProgress, bookContent } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { getBookById } from "@/lib/books";

/**
 * "Continue Reading" for an authenticated user.
 *
 * Reads persisted reading progress (Phase 3's reader will write this; the
 * table already exists) and renders the most recent in-progress book. When
 * there is no progress — or the user is anonymous — the section is omitted
 * entirely rather than shown empty.
 */
export async function ContinueReading({
  userId,
  limit = 4,
}: {
  userId: string;
  limit?: number;
}) {
  const rows = await db
    .select({
      bookId: readingProgress.bookId,
      chapterIndex: readingProgress.chapterIndex,
      positionPct: readingProgress.positionPct,
      lastOpenedAt: readingProgress.lastOpenedAt,
      updatedAt: readingProgress.updatedAt,
    })
    .from(readingProgress)
    .where(eq(readingProgress.userId, userId))
    .orderBy(desc(readingProgress.lastOpenedAt))
    .limit(limit);

  if (!rows.length) return null;

  const items = [];
  for (const r of rows) {
    const book = await getBookById(r.bookId);
    if (!book) continue;
    const contentRow = await db
      .select({ wordCount: bookContent.wordCount, sections: bookContent.sections })
      .from(bookContent)
      .where(eq(bookContent.bookId, r.bookId))
      .limit(1);
    items.push({ ...r, book, content: contentRow[0] ?? null });
  }

  if (!items.length) return null;

  return (
    <section aria-labelledby="continue-reading-heading">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <h2
          id="continue-reading-heading"
          className="font-heading text-xl font-semibold tracking-tight"
        >
          Continue Reading
        </h2>
      </div>

      <ul className="space-y-3">
        {items.map(({ book, chapterIndex, positionPct, content }) => {
          const pct = Math.round((positionPct ?? 0) * 100);
          const progress = content && content.wordCount
            ? Math.min(100, Math.round(((positionPct ?? 0)) * 100))
            : pct;
          return (
            <li
              key={book.id}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4"
            >
              <div className="flex-1">
                <Link
                  href={`/books/${book.id}`}
                  className="font-heading font-semibold hover:text-primary"
                >
                  {book.title}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {book.authors.join(", ")}
                  {chapterIndex != null
                    ? ` · Section ${chapterIndex + 1}`
                    : ""}
                </p>
                <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{progress}%</p>
              </div>
              <Button asChild size="sm">
                <Link href={`/books/${book.id}/read`}>Continue</Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
