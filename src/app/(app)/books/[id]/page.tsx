import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, BookMarked, ShieldCheck, Library, Globe, Tag } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getBookById } from "@/lib/books";
import { getSession } from "@/lib/session";
import { isInLibrary } from "@/lib/library-actions";
import { languageLabel } from "@/lib/languages";
import { AddToLibraryButton } from "@/components/add-to-library";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookById(id).catch(() => null);
  if (!book) {
    return { title: "Book not found" };
  }
  return {
    title: book.title,
    description:
      book.description ??
      `Read ${book.title} by ${book.authors.join(", ")} — free and legally distributable.`,
    openGraph: {
      title: book.title,
      description:
        book.description ??
        `Read ${book.title} by ${book.authors.join(", ")}.`,
      type: "book",
      images: book.coverUrl ? [{ url: book.coverUrl }] : undefined,
    },
  };
}

export default async function BookPage({ params }: PageProps) {
  const { id } = await params;
  const [book, session] = await Promise.all([
    getBookById(id).catch(() => null),
    getSession(),
  ]);

  if (!book) notFound();

  const inLibrary = session?.user ? await isInLibrary(book.id) : false;

  const sourceLabel: Record<string, string> = {
    gutenberg: "Project Gutenberg",
    openlibrary: "Open Library",
    standard_ebooks: "Standard Ebooks",
    curated: "Curated",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/search" className="hover:text-primary">
          Search
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div className="mx-auto aspect-[3/4] w-48 overflow-hidden rounded-xl bg-muted/40 ring-1 ring-foreground/10 md:w-full">
          <BookCover src={book.coverUrl} alt={book.title} sizes="220px" />
        </div>

        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {book.title}
          </h1>
          {book.subtitle ? (
            <p className="mt-1 text-lg text-muted-foreground">{book.subtitle}</p>
          ) : null}

          <p className="mt-2 text-muted-foreground">
            by <span className="font-medium text-foreground">{book.authors.join(", ") || "Unknown"}</span>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              <Globe className="size-3" />
              {languageLabel(book.language)}
            </span>
            {book.genres.map((g) => (
              <Link
                key={g}
                href={`/search?q=${encodeURIComponent(g)}`}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Tag className="size-3" />
                {g}
              </Link>
            ))}
          </div>

          {book.description ? (
            <p className="prose-reading mt-6 max-w-xl text-muted-foreground">
              {book.description}
            </p>
          ) : null}

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              {book.readable ? (
                <span>
                  This book is available to read — it is in the public domain.
                </span>
              ) : (
                <span>
                  This book is for reference only. Reading is not available
                  because its rights could not be verified for free
                  distribution.
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Source: {sourceLabel[book.source] ?? book.source}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {book.readable ? (
              <Button asChild size="lg">
                <Link href={`/books/${book.id}/read`}>
                  <BookOpen data-icon="inline-start" />
                  Read
                </Link>
              </Button>
            ) : (
              <Button size="lg" variant="outline" disabled>
                <BookOpen data-icon="inline-start" />
                Reading unavailable
              </Button>
            )}

            {session?.user ? (
              <AddToLibraryButton
                bookId={book.id}
                inLibrary={inLibrary}
                title={book.title}
              />
            ) : (
              <Button asChild variant="outline" size="lg">
                <Link href="/sign-in">
                  <BookMarked data-icon="inline-start" />
                  Sign in to save
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-2 text-muted-foreground">
        <Library className="size-4" />
        <span className="text-sm">Not the book you were after? </span>
        <Link href="/search" className="text-sm text-primary hover:underline">
          Search the catalogue
        </Link>
      </div>
    </div>
  );
}
