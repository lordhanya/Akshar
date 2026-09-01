import { describe, it, expect } from "vitest";
import { parseAtomFeed, normalizeAtomEntry } from "./normalize";

const FEED = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Standard Ebooks New Releases</title>
  <entry>
    <title>Emma</title>
    <id>https://standardebooks.org/ebooks/jane-austen_emma</id>
    <author><name>Jane Austen</name></author>
    <summary>A novel.</summary>
    <category term="Romance"/>
    <published>2024-01-01</published>
  </entry>
  <entry>
    <title>Frankenstein</title>
    <id>https://standardebooks.org/ebooks/mary-shelley_frankenstein</id>
    <author><name>Mary Shelley</name></author>
  </entry>
</feed>`;

describe("normalizeAtomEntry", () => {
  it("defaults to restricted rights (US-only public domain)", () => {
    const b = normalizeAtomEntry({ title: "T", id: "https://standardebooks.org/ebooks/x" })!;
    expect(b.rights).toBe("restricted");
    expect(b.source).toBe("standard_ebooks");
  });

  it("honors an explicit rights override", () => {
    const b = normalizeAtomEntry(
      { title: "T", id: "https://standardebooks.org/ebooks/x" },
      { rightsOverride: "public_domain" }
    )!;
    expect(b.rights).toBe("public_domain");
  });

  it("returns null when title or a valid URL id is missing", () => {
    expect(normalizeAtomEntry({ title: "T" })).toBeNull();
    expect(normalizeAtomEntry({ id: "not-a-url" })).toBeNull();
  });
});

describe("parseAtomFeed", () => {
  it("parses a multi-entry Atom feed into restricted books", () => {
    const books = parseAtomFeed(FEED);
    expect(books).toHaveLength(2);
    expect(books[0].title).toBe("Emma");
    expect(books[1].rights).toBe("restricted");
  });

  it("returns an empty array on malformed XML or no entries", () => {
    expect(parseAtomFeed("<not-xml")).toEqual([]);
    expect(parseAtomFeed("<?xml?><feed></feed>")).toEqual([]);
  });
});
