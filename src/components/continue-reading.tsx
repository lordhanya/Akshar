import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { BookOpen, Clock } from "lucide-react";
import { db } from "@/db";
import { readingProgress } from "@/db/schema";
import { BookCover } from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { getBookById } from "@/lib/books";

/**
 * "Continue Reading" for an authenticated user.
 *
 * Shows the most recently opened books with reading progress. Each entry
 * displays the book cover, title, author, progress bar, and a continue
 * button. When there is no progress — or the user is anonymous — the
 * section is omitted entirely.
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
      positionPct: readingProgress.positionPct,
      lastOpenedAt: readingProgress.lastOpenedAt,
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
    items.push({ ...r, book });
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

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map(({ book, positionPct, lastOpenedAt }) => {
          const pct = Math.round((positionPct ?? 0) * 100);
          const timeAgo = lastOpenedAt ? formatTimeAgo(lastOpenedAt) : null;

          return (
            <li
              key={book.id}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <Link
                href={`/books/${book.id}`}
                className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted/40"
              >
                <BookCover
                  src={book.coverUrl}
                  alt={book.title}
                  sizes="56px"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/books/${book.id}`}
                  className="line-clamp-1 font-heading font-semibold hover:text-primary"
                >
                  {book.title}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {book.authors.join(", ") || "Unknown author"}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 max-w-[160px] overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                </div>
                {timeAgo && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {timeAgo}
                  </p>
                )}
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

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const then = date.getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
