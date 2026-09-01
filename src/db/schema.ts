import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
  real,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/**
 * Legal rights under which a book's content may be distributed.
 *
 * Hard legal guardrail: only books with a value permitting free distribution
 * may ever be rendered with a "Read" action. Enforced as a PostgreSQL enum
 * so an invalid value can never be written, regardless of code.
 */
export const rightsEnum = pgEnum("rights", [
  "public_domain",
  "cc",
  "free",
  "restricted",
]);

export const bookSourceEnum = pgEnum("book_source", [
  "openlibrary",
  "gutenberg",
  "standard_ebooks",
  "curated",
]);

export type Rights = (typeof rightsEnum.enumValues)[number];
export type BookSource = (typeof bookSourceEnum.enumValues)[number];

/**
 * Application schema for the reading platform.
 *
 * This module is intentionally kept provider-agnostic. Book content is
 * referenced (never stored) so that Project Gutenberg, Standard Ebooks,
 * Open Library, or future sources can map into this normalized model.
 *
 * Large book text is NOT stored in PostgreSQL — only metadata and user
 * data. Content is resolved at read time via a provider adapter (Phase 1).
 *
 * The `user` table comes from Better Auth (see ./auth-schema). Application
 * tables reference it for foreign keys.
 */

/**
 * Normalized book catalog entry.
 *
 * One row per book, regardless of which provider supplied it. `source` +
 * `sourceId` locate the row in its origin system; `coverUrl` and other
 * metadata are cached for display. `rights` gates content access.
 */
export const books = pgTable(
  "books",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    language: text("language").notNull(),
    source: bookSourceEnum("source").notNull(),
    sourceId: text("sourceId").notNull(),
    coverUrl: text("coverUrl"),
    rights: rightsEnum("rights").notNull(),
    status: text("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("books_source_source_id_unique").on(t.source, t.sourceId),
    index("books_language_idx").on(t.language),
    index("books_rights_idx").on(t.rights),
  ]
);

/**
 * Authors, normalized and shared across books.
 */
export const authors = pgTable(
  "authors",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    bio: text("bio"),
  },
  (t) => [uniqueIndex("authors_name_unique").on(t.name)]
);

/**
 * Many-to-many link between books and authors, preserving order.
 */
export const bookAuthors = pgTable(
  "book_authors",
  {
    bookId: text("bookId")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    authorId: text("authorId")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.bookId, t.authorId] }),
    index("book_authors_author_idx").on(t.authorId),
  ]
);

/**
 * Genre/subject taxonomy for genre-wise discovery.
 */
export const genres = pgTable(
  "genres",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
  }
);

/**
 * Many-to-many link between books and genres.
 */
export const bookGenres = pgTable(
  "book_genres",
  {
    bookId: text("bookId")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    genreId: text("genreId")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.bookId, t.genreId] }),
    index("book_genres_genre_idx").on(t.genreId),
  ]
);

/**
 * A user's saved library items ("Add to library").
 */
export const libraryItems = pgTable(
  "library_items",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookId: text("bookId")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("library_items_user_book_unique").on(t.userId, t.bookId),
    index("library_items_user_idx").on(t.userId),
  ]
);

/**
 * Reading progress, persisted per user and book.
 *
 * `locator` is a provider-agnostic JSON value (e.g. section index + offset)
 * that survives format changes. `positionPct` is a 0..1 fraction used to
 * render a progress indicator and support "Continue Reading".
 */
export const readingProgress = pgTable(
  "reading_progress",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookId: text("bookId")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    locator: jsonb("locator"),
    chapterIndex: integer("chapter_index"),
    charOffset: integer("char_offset"),
    positionPct: real("position_pct"),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("reading_progress_user_book_unique").on(t.userId, t.bookId),
    index("reading_progress_user_idx").on(t.userId),
    index("reading_progress_book_idx").on(t.bookId),
  ]
);

/**
 * Bookmarks saved by a user within a book.
 */
export const bookmarks = pgTable(
  "bookmarks",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    bookId: text("bookId")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    locator: jsonb("locator"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("bookmarks_user_book_idx").on(t.userId, t.bookId),
  ]
);

/**
 * Cached normalized content for a book.
 *
 * This is the reader-facing cache described in the plan: complete book text is
 * NOT stored as a raw blob of every provider's format — it is normalized into
 * `sections` (jsonb) once, at fetch time, and reused across requests and
 * devices. Records are provider-agnostic.
 *
 * The store is intentionally behind a narrow interface (see
 * `src/lib/content-cache.ts`) so the backing store can move from Neon to
 * object storage (e.g. Neon Object Storage / S3) without changing any provider
 * or reader code — `sections` is the single normalized artifact either way.
 */
export const bookContent = pgTable(
  "book_content",
  {
    bookId: text("bookId")
      .primaryKey()
      .references(() => books.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    sections: jsonb("sections").notNull(),
    sourceUrl: text("sourceUrl"),
    sourceSha256: text("sourceSha256"),
    wordCount: integer("word_count"),
    cachedAt: timestamp("cached_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("book_content_language_idx").on(t.language)]
);

