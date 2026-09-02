import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, LibraryBig } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { FilterPanel } from "@/components/filter-panel";
import { BookGrid } from "@/components/book-grid";
import { EmptyState } from "@/components/discovery-states";
import { Button } from "@/components/ui/button";
import { searchBooks, listLanguages, type CatalogBook } from "@/lib/books";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Akshar catalogue by title, author, or subject.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function param(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = param(sp.q);
  const genre = param(sp.genre);
  const language = param(sp.language);
  const author = param(sp.author);
  const availability = param(sp.availability) as
    | "readable"
    | "metadata-only"
    | "";

  let books: CatalogBook[] = [];
  let error = false;
  try {
    books = await searchBooks({
      query: q,
      genre: genre || undefined,
      language: language || undefined,
      author: author || undefined,
      availability: availability || undefined,
      limit: 96,
    });
  } catch {
    error = true;
  }

  const languages = (await listLanguages().catch(() => [])).map(
    (l) => l.language
  );

  const hasQuery = Boolean(q.trim());
  const empty = books.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Search the catalogue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search by title, author, or subject.
        </p>
        <SearchBar
          className="mt-5"
          defaultValue={q}
          autoFocus={hasQuery}
          placeholder="Search by title, author, or subject…"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <FilterPanel languages={languages} />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {error
            ? "—"
            : `${books.length} result${books.length === 1 ? "" : "s"}${
                hasQuery ? ` for “${q}”` : ""
              }`}
        </p>
      </div>

      <div className="mt-6">
        {error ? (
          <EmptyState
            icon={<LibraryBig className="size-6" />}
            title="Couldn’t reach the catalogue"
            description="There was a problem loading the catalogue. Please try again shortly."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/search">Try again</Link>
              </Button>
            }
          />
        ) : empty ? (
          <EmptyState
            icon={<SearchX className="size-6" />}
            title={hasQuery ? `No books found for “${q}”` : "No books found"}
            description={
              hasQuery
                ? "Try a different title, author, or subject — or clear your filters."
                : "This catalogue is small by design. Try browsing a category or language instead."
            }
            action={
              hasQuery ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/search">Clear search</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/">Browse the homepage</Link>
                </Button>
              )
            }
          />
        ) : (
          <BookGrid books={books} />
        )}
      </div>
    </div>
  );
}
