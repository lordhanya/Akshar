import type { BookRights, BookSource } from "@/providers/types";

/**
 * A curated seed record.
 *
 * Every field is meant to be pre-verified (see `src/seed/data/curated.ts`):
 * `source` + `sourceId` trace to a real record, `rights` is a deliberately
 * conservative classification, and `contentUrl` points at a legitimate source
 * for the text so `--fetch-content` can cache readable books.
 *
 * The seed runner maps these onto the normalized schema (books, authors,
 * genres + join tables) deterministically, so re-running is idempotent.
 */
export interface SeedBook {
  /** Deterministic app id (e.g. "gut-1342"). If omitted, derived from source+id. */
  id?: string;
  title: string;
  /** Optional original title in the native script (used for Assamese etc.). */
  originalTitle?: string | null;
  description?: string | null;
  language: string;
  source: BookSource;
  sourceId: string;
  rights: BookRights;
  coverUrl?: string | null;
  authors: { name: string; slug?: string | null }[];
  genres: string[];
  /** URL to fetch and normalize content from (Gutenberg plain text). */
  contentUrl?: string | null;
  /** Verified attribution for this record (provenance note). */
  provenance?: string | null;
}
