import { describe, it, expect } from "vitest";
import {
  READABLE_RIGHTS,
  isReadable,
  parseRights,
  assertReadable,
  classifyRights,
} from "./rights";
import { ProviderError } from "./types";

describe("isReadable", () => {
  it("allows the three free-distribution rights", () => {
    for (const r of READABLE_RIGHTS) {
      expect(isReadable(r)).toBe(true);
    }
  });

  it("rejects restricted", () => {
    expect(isReadable("restricted")).toBe(false);
  });
});

describe("parseRights", () => {
  it("accepts known rights values", () => {
    expect(parseRights("public_domain")).toBe("public_domain");
    expect(parseRights("cc")).toBe("cc");
    expect(parseRights("free")).toBe("free");
    expect(parseRights("restricted")).toBe("restricted");
  });

  it("rejects unknown or non-string values", () => {
    expect(parseRights("pirated")).toBeNull();
    expect(parseRights(42)).toBeNull();
    expect(parseRights(null)).toBeNull();
  });
});

function book(rights: "public_domain" | "cc" | "free" | "restricted") {
  return {
    id: "b1",
    title: "Test",
    language: "en",
    source: "gutenberg" as const,
    sourceId: "1",
    rights,
    status: "published" as const,
    authors: [],
    genres: [],
    formats: [],
  };
}

describe("assertReadable", () => {
  it("does not throw for a readable book", () => {
    expect(() => assertReadable(book("public_domain"))).not.toThrow();
  });

  it("throws ProviderError for a restricted book", () => {
    expect(() => assertReadable(book("restricted"))).toThrow(ProviderError);
  });
});

describe("classifyRights", () => {
  it("prefers an explicit rights value", () => {
    expect(classifyRights({ rights: "cc" })).toBe("cc");
    expect(classifyRights({ rights: "free", gutenbergCopyright: true })).toBe("free");
  });

  it("classifies Gutendex copyright:false as public_domain", () => {
    expect(classifyRights({ gutenbergCopyright: false })).toBe("public_domain");
  });

  it("classifies Gutendex copyright true/unknown as restricted", () => {
    expect(classifyRights({ gutenbergCopyright: true })).toBe("restricted");
    expect(classifyRights({ gutenbergCopyright: null })).toBe("restricted");
    expect(classifyRights({})).toBe("restricted");
  });

  it("treats Open Library public lending catalog as restricted without jurisdiction sign", () => {
    expect(classifyRights({ openLibraryEbookAccess: "public" })).toBe("restricted");
  });

  it("allows Open Library public access when jurisdiction is signed", () => {
    expect(
      classifyRights(
        { openLibraryEbookAccess: "public" },
        { jurisdictionSigned: true }
      )
    ).toBe("public_domain");
  });
});
