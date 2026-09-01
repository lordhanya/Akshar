/**
 * Provider-independent normalized models.
 *
 * The application layer deals only with these types. It never needs to know
 * whether a book arrived from Open Library, Gutenberg, Standard Ebooks, or a
 * hand-curated seed — the provider adapters translate external API shapes
 * into these internal representations.
 *
 * The shapes intentionally mirror `src/db/schema.ts` so that persistence is a
 * near-1:1 mapping and the model can evolve without changing provider code.
 */

/** Legal rights under which a book's content is distributed. Mirrors `rightsEnum`. */
export type BookRights = "public_domain" | "cc" | "free" | "restricted";

/** Where a book record originated. Mirrors `bookSourceEnum`. */
export type BookSource = "openlibrary" | "gutenberg" | "standard_ebooks" | "curated";

/** A normalized author (maps to the `authors` table). */
export interface BookAuthor {
  id: string;
  name: string;
  slug?: string | null;
  bio?: string | null;
}

/** A subject/genre tag (maps to the `genres` table). */
export interface BookGenre {
  id: string;
  name: string;
  slug: string;
}

/** A downloadable rendering of a book (format identifier + canonical URL). */
export interface BookFormat {
  format: string;
  url: string;
}

/**
 * A fully normalized book record.
 *
 * `id` is the provider-agnostic application id (maps to `books.id`). `source`
 * + `sourceId` together locate it in its origin system. `rights` gates whether
 * Read access is ever enabled (see `rights.ts` in `src/providers`).
 */
export interface Book {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  language: string;
  source: BookSource;
  sourceId: string;
  rights: BookRights;
  status: "published" | "draft";
  coverUrl?: string | null;
  authors: BookAuthor[];
  genres: BookGenre[];
  formats: BookFormat[];
  createdAt?: Date;
  updatedAt?: Date;
}

/** One normalized section of a book's content (chapter / sub-section). */
export interface BookContentSection {
  id?: string;
  heading?: string | null;
  paragraphs: string[];
}

/**
 * Normalized textual content ready for the reader.
 *
 * This is the representation both a Neon-backed cache and (later) an
 * object-storage cache schema around. `sourceUrl` preserves attribution.
 */
export interface BookContent {
  bookId: string;
  language: string;
  sections: BookContentSection[];
  sourceUrl?: string | null;
  wordCount?: number;
}

/** Search parameters understood by every provider. */
export interface BookSearchQuery {
  query: string;
  languages?: string[];
  limit?: number;
  offset?: number;
}

/** Something a provider adapter can safely surface instead of throwing. */
export type ProviderErrorKind = "provider_unavailable" | "not_found" | "invalid_data" | "rate_limited";

export class ProviderError extends Error {
  constructor(
    public readonly kind: ProviderErrorKind,
    message: string,
    public readonly source?: BookSource
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/**
 * The contract every provider adapter implements.
 *
 * Implementations must not throw for transient failures — instead they return
 * rejection via `ProviderError` so the application can degrade gracefully
 * (continue showing cached/seeded data) rather than crash.
 */
export interface BookProvider {
  readonly source: BookSource;
  /** Discover books matching `query`. Returns an empty array on failure. */
  search(query: BookSearchQuery): Promise<Book[]>;
  /** Look up a single book by its id in the origin system. Returns null on failure. */
  findById(sourceId: string): Promise<Book | null>;
  /**
   * Fetch and normalize a book's content for reading.
   * Returns null when content is not legally available or cannot be fetched.
   */
  getContent(book: Book): Promise<BookContent | null>;
}
