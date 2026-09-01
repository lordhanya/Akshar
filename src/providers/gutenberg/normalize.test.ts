import { describe, it, expect } from "vitest";
import {
  normalizeGutendexDoc,
  normalizeGutendexSearch,
  plainTextUrl,
} from "./normalize";
import type { GutendexResponse } from "./normalize";

const DOC = {
  id: 1342,
  title: "Pride and Prejudice",
  authors: [{ name: "Austen, Jane" }],
  languages: ["en"],
  copyright: false,
  summaries: ["A novel."],
  subjects: ["Young women", "England"],
  formats: {
    "text/plain; charset=utf-8": "https://www.gutenberg.org/ebooks/1342.txt.utf-8",
    "image/jpeg": "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
  },
};

describe("normalizeGutendexDoc", () => {
  it("normalizes a copyright:false record to public_domain and guts ids", () => {
    const b = normalizeGutendexDoc(DOC)!;
    expect(b.id).toBe("gut-1342");
    expect(b.source).toBe("gutenberg");
    expect(b.sourceId).toBe("1342");
    expect(b.rights).toBe("public_domain");
    expect(b.language).toBe("en");
    expect(b.genres[0].id).toBe("young-women");
  });

  it("classifies copyright:true as restricted (metadata only)", () => {
    const b = normalizeGutendexDoc({ ...DOC, copyright: true })!;
    expect(b.rights).toBe("restricted");
  });

  it("returns null for a record without a valid id/title", () => {
    expect(normalizeGutendexDoc({ id: 5 })).toBeNull();
    expect(normalizeGutendexDoc({ title: "No id" })).toBeNull();
  });

  it("handles missing/corrupt languages", () => {
    const b = normalizeGutendexDoc({ ...DOC, languages: [] })!;
    expect(b.language).toBe("und");
  });
});

describe("normalizeGutendexSearch", () => {
  it("maps a Gutendex response to an array of books", () => {
    const res: GutendexResponse = { results: [DOC, { ...DOC, id: 84, title: "Frankenstein" }] };
    const books = normalizeGutendexSearch(res);
    expect(books).toHaveLength(2);
    expect(books[1].id).toBe("gut-84");
  });

  it("returns an empty array for empty/invalid payloads", () => {
    expect(normalizeGutendexSearch({})).toEqual([]);
    expect(normalizeGutendexSearch({ results: [] })).toEqual([]);
  });
});

describe("plainTextUrl", () => {
  it("picks the utf-8 plain text URL when present", () => {
    expect(plainTextUrl(DOC)).toBe(
      "https://www.gutenberg.org/ebooks/1342.txt.utf-8"
    );
  });

  it("returns null when no textual format exists", () => {
    expect(plainTextUrl({ id: 1, formats: { "text/html": "x" } })).toBeNull();
  });
});
