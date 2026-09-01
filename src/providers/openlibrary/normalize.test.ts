import { describe, it, expect } from "vitest";
import {
  normalizeOpenLibraryDoc,
  normalizeOpenLibrarySearch,
  authorIdFromKey,
  bookIdFromKey,
} from "./normalize";

describe("bookIdFromKey / authorIdFromKey", () => {
  it("normalizes Open Library work and author keys", () => {
    expect(bookIdFromKey("/works/OL262421W", "Some Title")).toBe("ol-262421");
    expect(authorIdFromKey("/authors/OL161167A", "Jane Austen")).toBe("ol-161167");
  });

  it("falls back to deterministic slug ids", () => {
    expect(bookIdFromKey(undefined, "Some Title")).toBe("ol-title-some-title");
    expect(authorIdFromKey(undefined, "John Doe")).toBe("ol-name-john-doe");
  });
});

describe("normalizeOpenLibraryDoc", () => {
  it("normalizes metadata and defaults to restricted rights", () => {
    const b = normalizeOpenLibraryDoc({
      key: "/works/OL262421W",
      title: "Pride and Prejudice",
      author_name: ["Jane Austen"],
      author_key: ["/authors/OL161167A"],
      language: ["eng"],
      subject: ["Romance"],
      cover_i: 123,
    })!;
    expect(b.id).toBe("ol-262421");
    expect(b.source).toBe("openlibrary");
    expect(b.rights).toBe("restricted");
    expect(b.language).toBe("en");
    expect(b.authors[0].id).toBe("ol-161167");
    expect(b.coverUrl).toBe("https://covers.openlibrary.org/b/id/123-M.jpg");
  });

  it("returns null when title is missing", () => {
    expect(normalizeOpenLibraryDoc({})).toBeNull();
  });

  it("supports object-form descriptions and subtitle", () => {
    const b = normalizeOpenLibraryDoc({
      key: "/works/OL1W",
      title: "T",
      subtitle: "Sub",
      description: { value: "A description." },
    })!;
    expect(b.subtitle).toBe("Sub");
    expect(b.description).toBe("A description.");
  });
});

describe("normalizeOpenLibrarySearch", () => {
  it("returns an empty array for an empty payload", () => {
    expect(normalizeOpenLibrarySearch({})).toEqual([]);
  });
});
