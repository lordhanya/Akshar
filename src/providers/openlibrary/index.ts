import type {
  Book,
  BookContent,
  BookProvider,
  BookSearchQuery,
  ProviderError,
} from "@/providers/types";
import { httpGetText } from "@/providers/http";
import {
  normalizeOpenLibrarySearch,
  type OpenLibrarySearchResponse,
} from "./normalize";

const BASE = "https://openlibrary.org/search.json";

/**
 * Open Library — discovery and metadata only.
 *
 * OL is deliberately NOT used as an ebook-content provider (per the plan).
 * `getContent` always resolves to null. Searches carry an identified
 * User-Agent and are deduplicated/cached through the shared HTTP helper.
 */
export class OpenLibraryProvider implements BookProvider {
  readonly source = "openlibrary" as const;

  async search(query: BookSearchQuery): Promise<Book[]> {
    const params = new URLSearchParams({
      q: query.query,
      limit: String(query.limit ?? 20),
      fields: [
        "key",
        "title",
        "subtitle",
        "author_name",
        "author_key",
        "first_publish_year",
        "cover_i",
        "language",
        "subject",
        "ebook_access",
        "description",
      ].join(","),
    });
    if (query.offset) params.set("offset", String(query.offset));

    const { body } = await httpGetText(
      `${BASE}?${params.toString()}`,
      {},
      this.source
    );
    const payload = JSON.parse(body) as OpenLibrarySearchResponse;
    return normalizeOpenLibrarySearch(payload);
  }

  async findById(sourceId: string): Promise<Book | null> {
    // Translate a work id (OL262421W) into a search for a stable result.
    const clean = sourceId.replace(/^\/+/, "").replace(/^works\//, "");
    const params = new URLSearchParams({
      q: `key:${clean}`,
      limit: "1",
      fields: [
        "key",
        "title",
        "subtitle",
        "author_name",
        "author_key",
        "first_publish_year",
        "cover_i",
        "language",
        "subject",
        "ebook_access",
      ].join(","),
    });
    try {
      const { body } = await httpGetText(
        `${BASE}?${params.toString()}`,
        {},
        this.source
      );
      const results = normalizeOpenLibrarySearch(
        JSON.parse(body) as OpenLibrarySearchResponse
      );
      return results.find((b) => b.sourceId === clean) ?? results[0] ?? null;
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async getContent(_book: Book): Promise<BookContent | null> {
    // Open Library is metadata-only; no content fetch.
    return null;
  }
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as ProviderError).kind === "not_found"
  );
}
