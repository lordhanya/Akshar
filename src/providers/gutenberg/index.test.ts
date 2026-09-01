import { describe, it, expect, vi, beforeEach } from "vitest";
import { GutenbergProvider } from "./index";
import { ProviderError } from "@/providers/types";

vi.mock("@/providers/http", () => ({
  httpGetText: vi.fn(),
}));

import { httpGetText } from "@/providers/http";
const mockGet = vi.mocked(httpGetText);

const DOC = {
  id: 1342,
  title: "Pride and Prejudice",
  authors: [{ name: "Austen, Jane" }],
  languages: ["en"],
  copyright: false,
  formats: {
    "text/plain; charset=utf-8": "https://www.gutenberg.org/ebooks/1342.txt.utf-8",
  },
};

const PLAIN_TEXT = `The Project Gutenberg eBook of Pride and Prejudice

*** START OF THE PROJECT GUTENBERG EBOOK PRIDE AND PREJUDICE ***

CHAPTER I.

It is a truth universally acknowledged.

*** END OF THE PROJECT GUTENBERG EBOOK PRIDE AND PREJUDICE ***`;

function provider() {
  return new GutenbergProvider();
}

beforeEach(() => {
  mockGet.mockReset();
});

describe("GutenbergProvider.search", () => {
  it("normalizes the search response into books", async () => {
    mockGet.mockResolvedValue({
      ok: true,
      status: 200,
      contentType: "utf-8",
      body: JSON.stringify({ results: [DOC] }),
    });
    const books = await provider().search({ query: "austen" });
    expect(books[0].id).toBe("gut-1342");
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("/books?"),
      expect.anything(),
      "gutenberg"
    );
  });

  it("rejects with ProviderError rather than crashing the app", async () => {
    mockGet.mockRejectedValue(new ProviderError("provider_unavailable", "down"));
    await expect(provider().search({ query: "austen" })).rejects.toThrow(ProviderError);
  });
});

describe("GutenbergProvider.findById", () => {
  it("fetches the single-book endpoint and normalizes", async () => {
    mockGet.mockResolvedValue({
      ok: true,
      status: 200,
      contentType: "utf-8",
      body: JSON.stringify(DOC),
    });
    const book = await provider().findById("gut-1342");
    expect(book?.id).toBe("gut-1342");
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringMatching(/gutendex\.com\/books\/1342$/),
      expect.anything(),
      "gutenberg"
    );
  });

  it("returns null for malformed ids", async () => {
    await expect(provider().findById("gutenberg-not-a-number")).resolves.toBeNull();
  });

  it("rejects with ProviderError when the provider fails", async () => {
    mockGet.mockRejectedValue(new ProviderError("provider_unavailable", "down"));
    await expect(provider().findById("1342")).rejects.toThrow(ProviderError);
  });
});

describe("GutenbergProvider.getContent", () => {
  const readableBook = {
    id: "gut-1342",
    title: "Pride and Prejudice",
    language: "en",
    source: "gutenberg" as const,
    sourceId: "1342",
    rights: "public_domain" as const,
    status: "published" as const,
    authors: [],
    genres: [],
    formats: [
      { format: "text/plain; charset=utf-8", url: "https://www.gutenberg.org/ebooks/1342.txt.utf-8" },
    ],
  };

  it("fetches and parses content for a readable book", async () => {
    mockGet.mockResolvedValue({
      ok: true,
      status: 200,
      contentType: "utf-8",
      body: PLAIN_TEXT,
    });
    const content = await provider().getContent(readableBook);
    expect(content).not.toBeNull();
    expect(content!.bookId).toBe("gut-1342");
    expect(content!.wordCount).toBeGreaterThan(0);
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining(".txt.utf-8"),
      expect.objectContaining({ noCache: true }),
      "gutenberg"
    );
  });

  it("does not fetch content for a restricted book (rights guardrail)", async () => {
    const restricted = { ...readableBook, rights: "restricted" as const };
    await expect(provider().getContent(restricted)).rejects.toThrow(ProviderError);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("returns null for a readable book whose formats have no plain text", async () => {
    const noText = { ...readableBook, formats: [] };
    await expect(provider().getContent(noText)).resolves.toBeNull();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
