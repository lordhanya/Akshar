import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Bookmark as BookmarkIcon } from "lucide-react";
import { db } from "@/db";
import { readLaterItems } from "@/db/schema";
import { BookCover } from "@/components/book-cover";
import { EmptyState } from "@/components/discovery-states";
import { Button } from "@/components/ui/button";
import { RemoveFromReadLaterButton } from "@/components/remove-from-read-later-button";
import { searchBooks, type CatalogBook } from "@/lib/books";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Read Later",
  description: "Books you saved for later on Akshar.",
};

export default async function ReadLaterPage() {
  const session = await getSession();
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-semibold">Read Later</h1>
        <p className="mt-3 text-muted-foreground">
          Sign in to save books for later and build your reading list.
        </p>
        <Button asChild className="mt-6">
          <Link href="/sign-in?next=/read-later">Sign in</Link>
        </Button>
      </div>
    );
  }

  const saved = await db
    .select({ bookId: readLaterItems.bookId, addedAt: readLaterItems.addedAt })
    .from(readLaterItems)
    .where(eq(readLaterItems.userId, session.user.id))
    .orderBy(desc(readLaterItems.addedAt));

  const ids = saved.map((s) => s.bookId);
  let books: CatalogBook[] = [];
  if (ids.length) {
    books = await searchBooks({ ids, limit: 200 });
  }

  const bookMap = new Map(books.map((b) => [b.id, b]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <BookmarkIcon className="size-5 text-primary" />
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Read Later
        </h1>
        {saved.length > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {saved.length} {saved.length === 1 ? "book" : "books"}
          </span>
        )}
      </div>

      {saved.length === 0 ? (
        <EmptyState
          icon={<BookmarkIcon className="size-6" />}
          title="No books saved yet"
          description="Tap the bookmark icon on any book card to save it for later."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/search">Find books</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {saved.map((s) => {
            const book = bookMap.get(s.bookId);
            if (!book) return null;
            return (
              <Link
                key={s.bookId}
                href={`/books/${s.bookId}`}
                className="group relative flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/40">
                  <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.02]">
                    <BookCover
                      src={book.coverUrl}
                      alt={book.title}
                      sizes="(min-width: 640px) 8rem, 6rem"
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1 px-3 pt-3 pb-2">
                  <h3 className="line-clamp-2 font-heading text-sm leading-snug font-medium">
                    {book.title}
                  </h3>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {book.authors.join(", ") || "Unknown author"}
                  </p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <RemoveFromReadLaterButton
                    bookId={book.id}
                    title={book.title}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
