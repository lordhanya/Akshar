import Link from "next/link";
import { BookOpen, Languages, Library as LibraryIcon, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { BookGrid } from "@/components/book-grid";
import { ContinueReading } from "@/components/continue-reading";
import { EmptyState } from "@/components/discovery-states";
import { Button } from "@/components/ui/button";
import {
  getRecentBooks,
  listCategories,
  listLanguages,
} from "@/lib/books";
import { getSession } from "@/lib/session";

export const metadata = {
  title: "Discover",
  description:
    "Browse and search free, legally distributable books. A calm digital reading room with regional-language support.",
};

export default async function HomePage() {
  const [session, recent, categories, languages] = await Promise.all([
    getSession(),
    getRecentBooks(10),
    listCategories(),
    listLanguages(),
  ]);

  const featured = recent.slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Hero + search */}
      <section className="mx-auto max-w-2xl py-6 text-center sm:py-10">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpen className="size-7" />
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          A calm place to read.
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          Discover and read free, legally distributable books — in English,
          <span lang="as"> অসমীয়া</span>, and other regional languages.
        </p>
        <SearchBar className="mt-8" autoFocus={false} />
        <p className="mt-3 text-xs text-muted-foreground">
          Search by title, author, or subject
        </p>
      </section>

      {/* Continue Reading (authenticated only; hidden when empty) */}
      {session?.user ? (
        <section className="mt-6">
          <ContinueReading userId={session.user.id} />
        </section>
      ) : null}

      <div className="mt-12 space-y-16">
        {/* Categories */}
        <CategorySection
          categories={
            categories.length ? categories : []
          }
        />

        {/* Languages */}
        <LanguageSection languages={languages} />

        {/* Recently added / curated */}
        {recent.length > 0 ? (
          <section aria-labelledby="recent-heading">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LibraryIcon className="size-5 text-primary" />
                <h2
                  id="recent-heading"
                  className="font-heading text-xl font-semibold tracking-tight"
                >
                  Recently added
                </h2>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/search">View all</Link>
              </Button>
            </div>
            <BookGrid books={recent} />
          </section>
        ) : null}

        {/* Featured / curated */}
        {featured.length > 0 ? (
          <section aria-labelledby="featured-heading">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h2
                id="featured-heading"
                className="font-heading text-xl font-semibold tracking-tight"
              >
                Featured
              </h2>
            </div>
            <BookGrid books={featured} />
          </section>
        ) : null}
      </div>
    </div>
  );
}

function CategorySection({
  categories,
}: {
  categories: { name: string; slug: string; count: number }[];
}) {
  const prioritized = categories.length
    ? [...categories].sort((a, b) => b.count - a.count).slice(0, 8)
    : [];

  return (
    <section aria-labelledby="categories-heading">
      <h2
        id="categories-heading"
        className="mb-4 font-heading text-xl font-semibold tracking-tight"
      >
        Categories
      </h2>
      {prioritized.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {prioritized.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/search?genre=${encodeURIComponent(c.slug)}`}
                className="flex h-full items-start justify-between gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <span>{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No categories yet"
          description="Categories will appear here as books are added to the catalogue."
        />
      )}
    </section>
  );
}

function LanguageSection({
  languages,
}: {
  languages: { language: string; count: number }[];
}) {
  const hasAssamese = languages.some((l) => l.language === "as");

  return (
    <section aria-labelledby="languages-heading">
      <div className="mb-4 flex items-center gap-2">
        <Languages className="size-5 text-primary" />
        <h2
          id="languages-heading"
          className="font-heading text-xl font-semibold tracking-tight"
        >
          Languages
        </h2>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {languages
          .filter((l) => l.language !== "as")
          .map((l) => (
            <li key={l.language}>
              <Link
                href={`/search?language=${encodeURIComponent(l.language)}`}
                className="flex h-full items-start justify-between gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <span>{languageName(l.language)}</span>
                <span className="text-xs text-muted-foreground">{l.count}</span>
              </Link>
            </li>
          ))}
      </ul>

      {/* Assamese — present as an intentional, honest block even while empty. */}
      <div className="mt-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3
              lang="as"
              className="font-assamese text-lg font-semibold"
            >
              অসমীয়া গ্ৰন্থসমূহ
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasAssamese
                ? `${languages.find((l) => l.language === "as")!.count} verified Assamese title(s).`
                : "We are adding verified Assamese-language titles. Right now the catalogue contains none — we do not list unverified books."}
            </p>
          </div>
          <Button asChild variant="outline" size="sm" disabled={!hasAssamese}>
            <Link href="/search?language=as">Browse Assamese</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function languageName(code: string): string {
  const map: Record<string, string> = {
    en: "English",
    as: "অসমীয়া",
    hi: "हिन्दी",
    bn: "বাংলা",
    fr: "French",
    de: "German",
    es: "Spanish",
    und: "Unknown",
  };
  return map[code] ?? code.toUpperCase();
}
