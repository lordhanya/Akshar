import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Library as LibraryIcon, BookMarked } from "lucide-react";
import { db } from "@/db";
import { libraryItems } from "@/db/schema";
import { BookGrid } from "@/components/book-grid";
import { EmptyState } from "@/components/discovery-states";
import { Button } from "@/components/ui/button";
import { searchBooks, type CatalogBook } from "@/lib/books";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "My Library",
  description: "Your saved books on Akshar.",
};

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

  const saved = await db
    .select({ bookId: libraryItems.bookId })
    .from(libraryItems)
    .where(eq(libraryItems.userId, session.user.id))
    .orderBy(desc(libraryItems.addedAt));

  const ids = saved.map((s) => s.bookId);
  let books: CatalogBook[] = [];
  if (ids.length) {
    books = await searchBooks({ ids, limit: 200 });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <LibraryIcon className="size-5 text-primary" />
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          My Library
        </h1>
      </div>

      {books.length ? (
        <BookGrid books={books} />
      ) : (
        <EmptyState
          icon={<BookMarked className="size-6" />}
          title="Your library is empty"
          description="When you save a book with “Add to library”, it appears here so you can pick it up any time."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/search">Find books</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
