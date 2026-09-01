import type {
  Book,
  BookContent,
  BookProvider,
  BookSearchQuery,
} from "@/providers/types";
import { httpGetText } from "@/providers/http";
import { parseAtomFeed } from "./normalize";

const NEW_RELEASES_FEED = "https://standardebooks.org/feeds/atom/new-releases";

/**
 * Standard Ebooks — free New Releases Atom feed only.
 *
 * The full OPDS catalog is a paid (Patrons Circle) benefit, so we use only the
 * open feed. It exposes the most recent titles with rich metadata (summary,
 * subjects, explicit rights statement) but no search or full-catalog paging.
 * Because the works' public-domain status is US-only and our audience is in
 * India, records are metadata-only (rights=restricted); `getContent` is not
 * implemented for this provider.
 */
export class StandardEbooksProvider implements BookProvider {
  readonly source = "standard_ebooks" as const;

  async search(_query: BookSearchQuery): Promise<Book[]> {
    const { body } = await httpGetText(NEW_RELEASES_FEED, {}, this.source);
    return parseAtomFeed(body);
  }

  async findById(sourceId: string): Promise<Book | null> {
    const { body } = await httpGetText(NEW_RELEASES_FEED, {}, this.source);
    return (
      parseAtomFeed(body).find((b) => b.sourceId === sourceId) ?? null
    );
  }

  async getContent(_book: Book): Promise<BookContent | null> {
    // Metadata-only provider; no content fetch for this source.
    return null;
  }
}
