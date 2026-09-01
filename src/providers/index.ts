import type { BookProvider, BookSource } from "./types";
import { OpenLibraryProvider } from "./openlibrary";
import { GutenbergProvider } from "./gutenberg";
import { StandardEbooksProvider } from "./standard-ebooks";

/**
 * Provider registry.
 *
 * The application asks for a provider by source and receives a uniform
 * `BookProvider`. This is the single seam between app code and external APIs —
 * adding a provider is a matter of registering a new adapter here.
 */

export type { BookProvider, BookSource } from "./types";

const registry: Record<BookSource, BookProvider> = {
  openlibrary: new OpenLibraryProvider(),
  gutenberg: new GutenbergProvider(),
  standard_ebooks: new StandardEbooksProvider(),
  curated: {
    // Curated seeds are stored in our DB, not fetched from a live provider.
    // A minimal no-op satisfies the interface so the registry stays uniform.
    source: "curated",
    async search() {
      return [];
    },
    async findById(_sourceId: string) {
      return null;
    },
    async getContent(_book) {
      return null;
    },
  },
};

export function getProvider(source: BookSource): BookProvider {
  return registry[source];
}

export function listProviders(): BookProvider[] {
  return Object.values(registry);
}

export { OpenLibraryProvider } from "./openlibrary";
export { GutenbergProvider } from "./gutenberg";
export { StandardEbooksProvider } from "./standard-ebooks";
export {
  isReadable,
  assertReadable,
  parseRights,
  classifyRights,
  READABLE_RIGHTS,
} from "./rights";
export { normalizeLanguage } from "./language";
