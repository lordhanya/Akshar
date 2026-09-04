import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, authors, bookAuthors, genres, bookGenres } from "@/db/schema";
import { isReadable } from "@/providers";

/**
 * Server-side discovery layer over the normalized catalog.
 *
 * All discovery (homepage, search, filters, book details) reads from the
 * local Postgres catalog that the seed populates from the Phase 1 providers.
 * The browser never talks to Open Library / Gutenberg directly, and live
 * providers are only exercised at seed time — so reads are fast, cached by
 * the DB, offline-friendly, and every result already carries a `rights` value
 * the UI can render against.
 */

export interface CatalogBook {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  language: string;
  source: "openlibrary" | "gutenberg" | "standard_ebooks" | "curated";
  sourceId: string;
  coverUrl: string | null;
  rights: "public_domain" | "cc" | "free" | "restricted";
  status: string;
  createdAt: Date;
  authors: string[];
  genres: string[];
  /** True when the book is readable (rights permit it). */
  readable: boolean;
  editorialNote: string | null;
}

export interface BookFilter {
  query?: string;
  genre?: string;
  language?: string;
  author?: string;
  /** Restrict to a specific set of book ids (e.g. a user's library). */
  ids?: string[];
  /** "readable" | "metadata-only" | undefined (all) */
  availability?: "readable" | "metadata-only";
  limit?: number;
  offset?: number;
}

const AUTHOR_NAMES = sql<string[]>`
  COALESCE(
    array_agg(DISTINCT ${authors.name}) FILTER (WHERE ${authors.name} IS NOT NULL),
    ARRAY[]::text[]
  )
`.as("author_names");

const GENRE_NAMES = sql<string[]>`
  COALESCE(
    array_agg(DISTINCT ${genres.name}) FILTER (WHERE ${genres.name} IS NOT NULL),
    ARRAY[]::text[]
  )
`.as("genre_names");

interface BookRow {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  language: string;
  source: CatalogBook["source"];
  sourceId: string;
  coverUrl: string | null;
  rights: CatalogBook["rights"];
  status: string;
  createdAt: Date;
  author_names: string[];
  genre_names: string[];
  editorialNote: string | null;
}

function toCatalogBook(r: BookRow): CatalogBook {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    language: r.language,
    source: r.source,
    sourceId: r.sourceId,
    coverUrl: r.coverUrl,
    rights: r.rights,
    status: r.status,
    createdAt: r.createdAt,
    authors: r.author_names,
    genres: r.genre_names,
    readable: isReadable(r.rights),
    editorialNote: r.editorialNote,
  };
}

/**
 * Search / filter the catalog.
 *
 * Matches a free-text query against title, subtitle, author and genre.
 * Optional filters narrow by genre slug, language, author, and rights-based
 * availability. Results are ordered newest first.
 */
export async function searchBooks(f: BookFilter = {}): Promise<CatalogBook[]> {
  const conds: ReturnType<typeof sql>[] = [];

  if (f.query?.trim()) {
    const q = f.query.trim();
    const byTitle = ilike(books.title, `%${q}%`);
    const bySubtitle = ilike(books.subtitle, `%${q}%`);
    const byAuthor = inArray(
      books.id,
      db
        .select({ id: bookAuthors.bookId })
        .from(bookAuthors)
        .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
        .where(ilike(authors.name, `%${q}%`))
    );
    const byGenre = inArray(
      books.id,
      db
        .select({ id: bookGenres.bookId })
        .from(bookGenres)
        .innerJoin(genres, eq(bookGenres.genreId, genres.id))
        .where(ilike(genres.name, `%${q}%`))
    );
    conds.push(or(byTitle, bySubtitle, byAuthor, byGenre)!);
  }

  if (f.genre) {
    conds.push(
      inArray(
        books.id,
        db
          .select({ id: bookGenres.bookId })
          .from(bookGenres)
          .innerJoin(genres, eq(bookGenres.genreId, genres.id))
          .where(eq(genres.slug, f.genre))
      )
    );
  }

  if (f.language) {
    conds.push(eq(books.language, f.language));
  }

  if (f.author) {
    conds.push(
      inArray(
        books.id,
        db
          .select({ id: bookAuthors.bookId })
          .from(bookAuthors)
          .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
          .where(eq(authors.name, f.author))
      )
    );
  }

  if (f.ids?.length) {
    conds.push(inArray(books.id, f.ids));
  }

  if (f.availability === "readable") {
    conds.push(inArray(books.rights, ["public_domain", "cc", "free"]));
  } else if (f.availability === "metadata-only") {
    conds.push(eq(books.rights, "restricted"));
  }

  const where = conds.length ? and(...conds) : undefined;
  const rows = await db
    .select({
      id: books.id,
      title: books.title,
      subtitle: books.subtitle,
      description: books.description,
      language: books.language,
      source: books.source,
      sourceId: books.sourceId,
      coverUrl: books.coverUrl,
      rights: books.rights,
      status: books.status,
      createdAt: books.createdAt,
      author_names: AUTHOR_NAMES,
      genre_names: GENRE_NAMES,
      editorialNote: books.editorialNote,
    })
    .from(books)
    .leftJoin(bookAuthors, eq(bookAuthors.bookId, books.id))
    .leftJoin(authors, eq(bookAuthors.authorId, authors.id))
    .leftJoin(bookGenres, eq(bookGenres.bookId, books.id))
    .leftJoin(genres, eq(bookGenres.genreId, genres.id))
    .where(where)
    .groupBy(books.id)
    .orderBy(desc(books.createdAt), books.title)
    .limit(f.limit ?? 60)
    .offset(f.offset ?? 0);

  return rows.map(toCatalogBook);
}

/** One book with its full detail row (or null). */
export async function getBookById(id: string): Promise<CatalogBook | null> {
  const rows = await db
    .select({
      id: books.id,
      title: books.title,
      subtitle: books.subtitle,
      description: books.description,
      language: books.language,
      source: books.source,
      sourceId: books.sourceId,
      coverUrl: books.coverUrl,
      rights: books.rights,
      status: books.status,
      createdAt: books.createdAt,
      author_names: AUTHOR_NAMES,
      genre_names: GENRE_NAMES,
      editorialNote: books.editorialNote,
    })
    .from(books)
    .leftJoin(bookAuthors, eq(bookAuthors.bookId, books.id))
    .leftJoin(authors, eq(bookAuthors.authorId, authors.id))
    .leftJoin(bookGenres, eq(bookGenres.bookId, books.id))
    .leftJoin(genres, eq(bookGenres.genreId, genres.id))
    .where(eq(books.id, id))
    .groupBy(books.id)
    .limit(1);

  return rows.length ? toCatalogBook(rows[0]) : null;
}

/** Languages present in the catalog, with book counts (counts always >= 1). */
export async function listLanguages(): Promise<{ language: string; count: number }[]> {
  const rows = await db
    .select({ language: books.language, count: sql<number>`count(*)`.as("count") })
    .from(books)
    .groupBy(books.language)
    .orderBy(desc(sql`count(*)`));
  return rows.map((r) => ({ language: r.language, count: r.count }));
}

/** Distinct genres present in the catalog, with book counts. */
export async function listCategories(): Promise<{
  name: string;
  slug: string;
  count: number;
}[]> {
  const rows = await db
    .select({
      name: genres.name,
      slug: genres.slug,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(genres)
    .innerJoin(bookGenres, eq(genres.id, bookGenres.genreId))
    .innerJoin(books, eq(bookGenres.bookId, books.id))
    .groupBy(genres.id)
    .orderBy(desc(sql`count(*)`));
  return rows.map((r) => ({ name: r.name, slug: r.slug, count: r.count }));
}

/** Most recent books added to the catalog. */
export async function getRecentBooks(limit = 12): Promise<CatalogBook[]> {
  return searchBooks({ limit });
}

/** Books belonging to a given language (e.g. "en", "as"). */
export async function getBooksByLanguage(
  language: string,
  limit = 12
): Promise<CatalogBook[]> {
  return searchBooks({ language, limit });
}

export { isReadable };
