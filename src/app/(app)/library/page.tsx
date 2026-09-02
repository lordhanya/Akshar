import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Library as LibraryIcon, BookMarked, BookOpen, Clock } from "lucide-react";
import { db } from "@/db";
import { libraryItems, readingProgress } from "@/db/schema";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/discovery-states";
import { Button } from "@/components/ui/button";
import { searchBooks, type CatalogBook } from "@/lib/books";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "My Library",
  description: "Your saved books on Akshar.",
};

interface LibraryEntry {
  book: CatalogBook;
  addedAt: Date;
  positionPct: number | null;
  lastOpenedAt: Date | null;
}

export default async function LibraryPage() {
  const session = await getSession();
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-semibold">My Library</h1>
        <p className="mt-3 text-muted-foreground">
          Sign in to save books to your library and pick up where you left off.
        </p>
        <Button asChild className="mt-6">
          <Link href="/sign-in?next=/library">Sign in</Link>
        </Button>
      </div>
    );
  }

  // Fetch saved books with their reading progress in one query.
  const rows = await db
    .select({
      bookId: libraryItems.bookId,
      addedAt: libraryItems.addedAt,
      positionPct: readingProgress.positionPct,
      lastOpenedAt: readingProgress.lastOpenedAt,
    })
    .from(libraryItems)
    .leftJoin(
      readingProgress,
      sql`${readingProgress.userId} = ${libraryItems.userId} AND ${readingProgress.bookId} = ${libraryItems.bookId}`
    )
    .where(eq(libraryItems.userId, session.user.id))
    .orderBy(desc(readingProgress.lastOpenedAt), desc(libraryItems.addedAt));

  const ids = rows.map((r) => r.bookId);
  let books: CatalogBook[] = [];
  if (ids.length) {
    books = await searchBooks({ ids, limit: 200 });
  }

  const bookMap = new Map(books.map((b) => [b.id, b]));

  const entries: LibraryEntry[] = rows
    .map((r) => {
      const book = bookMap.get(r.bookId);
      if (!book) return null;
      return {
        book,
        addedAt: r.addedAt,
        positionPct: r.positionPct,
        lastOpenedAt: r.lastOpenedAt,
      };
    })
    .filter(Boolean) as LibraryEntry[];

  // Split into in-progress and unread.
  const inProgress = entries.filter(
    (e) => e.positionPct != null && e.positionPct > 0
  );
  const unread = entries.filter(
    (e) => e.positionPct == null || e.positionPct === 0
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <LibraryIcon className="size-5 text-primary" />
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          My Library
        </h1>
        {entries.length > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "book" : "books"}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="size-6" />}
          title="Your library is empty"
          description='When you save a book with "Add to library", it appears here so you can pick it up any time.'
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/search">Find books</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-10">
          {/* In-progress books — shown first with progress bars. */}
          {inProgress.length > 0 && (
            <section aria-labelledby="in-progress-heading">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                <h2
                  id="in-progress-heading"
                  className="font-heading text-xl font-semibold tracking-tight"
                >
                  Continue Reading
                </h2>
              </div>
              <ul className="space-y-3">
                {inProgress.map((entry) => (
                  <LibraryRow key={entry.book.id} entry={entry} />
                ))}
              </ul>
            </section>
          )}

          {/* Unread books — shown as a grid. */}
          {unread.length > 0 && (
            <section aria-labelledby="saved-heading">
              <div className="mb-4 flex items-center gap-2">
                <BookMarked className="size-5 text-primary" />
                <h2
                  id="saved-heading"
                  className="font-heading text-xl font-semibold tracking-tight"
                >
                  {inProgress.length > 0 ? "Saved for Later" : "All Books"}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {unread.map((entry) => (
                  <LibraryCard key={entry.book.id} entry={entry} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/** A single in-progress book row with cover, progress bar, and continue button. */
function LibraryRow({ entry }: { entry: LibraryEntry }) {
  const pct = Math.round((entry.positionPct ?? 0) * 100);
  const timeAgo = entry.lastOpenedAt ? formatTimeAgo(entry.lastOpenedAt) : null;

  return (
    <li className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/50">
      <Link
        href={`/books/${entry.book.id}`}
        className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted/40"
      >
        <BookCover
          src={entry.book.coverUrl}
          alt={entry.book.title}
          sizes="56px"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/books/${entry.book.id}`}
          className="line-clamp-1 font-heading font-semibold hover:text-primary"
        >
          {entry.book.title}
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {entry.book.authors.join(", ") || "Unknown author"}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 max-w-[200px] overflow-hidden rounded-full bg-muted">
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
        <Link href={`/books/${entry.book.id}/read`}>Continue</Link>
      </Button>
    </li>
  );
}

/** A single unread book card with cover. */
function LibraryCard({ entry }: { entry: LibraryEntry }) {
  return (
    <Link
      href={`/books/${entry.book.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/40">
        <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.02]">
          <BookCover
            src={entry.book.coverUrl}
            alt={entry.book.title}
            sizes="(min-width: 640px) 8rem, 6rem"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3 pt-3 pb-2">
        <h3 className="line-clamp-2 font-heading text-sm leading-snug font-medium">
          {entry.book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {entry.book.authors.join(", ") || "Unknown author"}
        </p>
      </div>
    </Link>
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
