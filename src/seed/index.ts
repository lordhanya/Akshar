import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  books,
  authors,
  bookAuthors,
  genres,
  bookGenres,
} from "@/db/schema";
import { setCachedContent } from "@/lib/content-cache";
import { getProvider, isReadable } from "@/providers";
import type { Book, BookContent } from "@/providers/types";
import { curatedSeed } from "./data/curated";
import { assameseSeed } from "./data/assamese";
import type { SeedBook } from "./types";

/**
 * Reproducible seed process.
 *
 * Runs idempotently (safe to re-run): upserts the curated catalogue into the
 * normalized schema (books, authors, genres + join tables). With
 * `fetchContent` enabled it also fetches + caches normalized content for
 * readable books — this is OFF by default to avoid unnecessary downloads.
 *
 * Fails safely: an error in one book does not abort the whole seed; we report
 * per-record outcomes and continue.
 */

export interface SeedOptions {
  /** Fetch + cache normalized content for readable, content-bearing books. */
  fetchContent?: boolean;
  /** Only these source ids (e.g. ["1342"]) — for targeted re-seeding. */
  only?: string[];
  onEvent?: (msg: string) => void;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function log(opts: SeedOptions, msg: string) {
  if (opts.onEvent) opts.onEvent(msg);
  else console.log(msg);
}

async function upsertAuthor(name: string): Promise<string> {
  const slug = slugify(name) || `author-${name.length}`;
  const id = `auth-${slug}`;
  await db
    .insert(authors)
    .values({ id, name, slug })
    .onConflictDoUpdate({ target: authors.id, set: { name, slug } });
  return id;
}

async function upsertGenre(name: string): Promise<string> {
  const slug = slugify(name) || `genre-${name.length}`;
  const id = `gen-${slug}`;
  await db
    .insert(genres)
    .values({ id, slug, name })
    .onConflictDoUpdate({ target: genres.id, set: { slug, name } });
  return id;
}

async function seedOne(seed: SeedBook): Promise<string> {
  const bookId = seed.id ?? `${seed.source}-${seed.sourceId}`;
  const authorIds: string[] = [];
  for (const a of seed.authors) {
    authorIds.push(await upsertAuthor(a.name));
  }
  const genreIds: string[] = [];
  for (const g of seed.genres) {
    genreIds.push(await upsertGenre(g));
  }

  await db
    .insert(books)
    .values({
      id: bookId,
      title: seed.title,
      description: seed.description ?? null,
      language: seed.language,
      source: seed.source,
      sourceId: seed.sourceId,
      coverUrl: seed.coverUrl ?? null,
      rights: seed.rights,
      status: "published",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: books.id,
      set: {
        title: seed.title,
        description: seed.description ?? null,
        language: seed.language,
        coverUrl: seed.coverUrl ?? null,
        rights: seed.rights,
        status: "published",
        updatedAt: new Date(),
      },
    });

  // Replace author links (dedupe via primary key upsert).
  if (authorIds.length) {
    await db.delete(bookAuthors).where(eq(bookAuthors.bookId, bookId));
    await db
      .insert(bookAuthors)
      .values(authorIds.map((authorId, i) => ({ bookId, authorId, sortOrder: i })))
      .onConflictDoNothing();
  }
  // Replace genre links.
  if (genreIds.length) {
    await db.delete(bookGenres).where(eq(bookGenres.bookId, bookId));
    await db
      .insert(bookGenres)
      .values(genreIds.map((genreId) => ({ bookId, genreId })))
      .onConflictDoNothing();
  }

  return bookId;
}

async function maybeCacheContent(seed: SeedBook, opts: SeedOptions): Promise<void> {
  if (!opts.fetchContent) return;
  if (!isReadable(seed.rights)) return; // rights guardrail
  if (!seed.contentUrl) return;

  try {
    const bookId = seed.id ?? `${seed.source}-${seed.sourceId}`;
    // Build a minimal Book directly from the curated seed so we can call
    // getContent without a live findById round-trip (Gutendex's single-book
    // endpoint is slow/throttled and we already know the content URL).
    const provider = getProvider(seed.source);
    const book: Book = {
      id: bookId,
      title: seed.title,
      language: seed.language,
      source: seed.source,
      sourceId: seed.sourceId,
      rights: seed.rights,
      status: "published",
      authors: seed.authors.map((a) => ({ id: `seed-${a.name}`, name: a.name })),
      genres: [],
      formats: [{ format: "text/plain; charset=utf-8", url: seed.contentUrl! }],
    };

    const content: BookContent | null = await provider.getContent(book);
    if (!content) return;
    content.bookId = bookId;
    content.sourceUrl = seed.contentUrl;
    await setCachedContent(bookId, content);
    log(opts, `  cached content for ${seed.title} (${content.wordCount ?? 0} words)`);
  } catch (err) {
    log(opts, `  content fetch failed for ${seed.title}: ${(err as Error).message}`);
  }
}

export async function seedCatalog(opts: SeedOptions = {}): Promise<{
  seeded: number;
  failed: number;
  assamese: number;
}> {
  const all = [...curatedSeed, ...assameseSeed];
  const only = new Set(opts.only ?? []);
  let seeded = 0;
  let failed = 0;

  for (const seed of all) {
    if (only.size && !only.has(seed.sourceId)) continue;
    try {
      await seedOne(seed);
      await maybeCacheContent(seed, opts);
      seeded++;
    } catch (err) {
      failed++;
      log(opts, `  ERROR seeding "${seed.title}": ${(err as Error).message}`);
    }
  }

  return { seeded, failed, assamese: assameseSeed.length };
}
