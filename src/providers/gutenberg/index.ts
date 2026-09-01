import type {
  Book,
  BookContent,
  BookProvider,
  BookSearchQuery,
  ProviderError,
} from "@/providers/types";
import { httpGetText } from "@/providers/http";
import { assertReadable } from "@/providers/rights";
import { normalizeGutendexSearch, type GutendexResponse } from "./normalize";
import { parseGutenbergText } from "./content";

const BASE = "https://gutendex.com/books";
const MAX_CONTENT_BYTES = Number(process.env.GUTENBERG_MAX_CONTENT_BYTES ?? 3_000_000);

/**
 * Project Gutenberg via the Gutendex mirror.
 *
 * Used for discovery (which books exist, with metadata) and as the content
 * provider for public-domain works. `copyright:false` records are readable;
 * all other records are metadata-only. We never bulk-download the catalog and
 * content is fetched lazily, then cached via the DB-backed cache.
 */
export class GutenbergProvider implements BookProvider {
  readonly source = "gutenberg" as const;

  async search(query: BookSearchQuery): Promise<Book[]> {
    const params = new URLSearchParams();
    if (query.query) params.set("search", query.query);
    if (query.limit) params.set("page_size", String(query.limit));
    if (query.languages?.length) params.set("languages", query.languages[0]);

    const { body } = await httpGetText(
      `${BASE}?${params.toString()}`,
      {},
      this.source
    );
    return normalizeGutendexSearch(JSON.parse(body) as GutendexResponse);
  }

  async findById(sourceId: string): Promise<Book | null> {
    const numeric = sourceId.replace(/^gut-/, "");
    if (!/^\d+$/.test(numeric)) return null;
    const { body } = await httpGetText(`${BASE}/${numeric}`, {}, this.source);
    const doc = JSON.parse(body) as NonNullable<GutendexResponse["results"]>[number];
    return normalizeGutendexSearch({ results: [doc] })[0] ?? null;
  }

  async getContent(book: Book): Promise<BookContent | null> {
    // Rights gate first — never fetch content for a restricted book.
    assertReadable(book);

    const url = book.formats.find(
      (f) =>
        f.format === "text/plain; charset=utf-8" ||
        f.format === "text/plain; charset=us-ascii" ||
        f.format === "text/plain"
    )?.url;
    if (!url) return null;

    let result;
    try {
      result = await httpGetText(
        url,
        { noCache: true, maxBytes: MAX_CONTENT_BYTES },
        this.source
      );
    } catch (err) {
      if (isProviderError(err, "not_found")) return null;
      throw err;
    }
    return parseGutenbergText(book.id, book.language, result.body);
  }
}

function isProviderError(err: unknown, kind?: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as ProviderError).kind === (kind ?? "")
  );
}
