import { describe, it, expect } from "vitest";
import { curatedSeed } from "./data/curated";
import { assameseSeed } from "./data/assamese";
import { READABLE_RIGHTS, isReadable } from "@/providers/rights";

describe("curatedSeed", () => {
  it("contains at least one readable, content-bearing book", () => {
    const readable = curatedSeed.filter((s) => isReadable(s.rights) && s.contentUrl);
    expect(readable.length).toBeGreaterThan(0);
  });

  it("has stable, unique ids", () => {
    const ids = curatedSeed.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every record declares a known source and a readable-or-restricted rights", () => {
    for (const s of curatedSeed) {
      expect(["gutenberg", "openlibrary", "standard_ebooks", "curated"]).toContain(
        s.source
      );
      expect(["public_domain", "cc", "free", "restricted"]).toContain(s.rights);
    }
  });

  it("every readable book has a content URL (Read depends on it)", () => {
    for (const s of curatedSeed) {
      if (isReadable(s.rights)) {
        expect(s.contentUrl).toBeTruthy();
      }
    }
  });
});

describe("assameseSeed (Assamese guardrail)", () => {
  it("is intentionally empty — no fabricated Assamese records", () => {
    expect(assameseSeed).toEqual([]);
  });

  it("is wired for future verified imports (its own, separate array)", () => {
    // The seed merges curated + assamese; an empty Assamese set simply adds
    // zero books while keeping the pipeline ready for verified records.
    expect(Array.isArray(assameseSeed)).toBe(true);
  });
});

describe("seed catalogue rights coherence", () => {
  it("all readable rights present in the constant are free-distribution", () => {
    // Sanity: anything we mark readable must be constrained to the allowed set.
    for (const r of READABLE_RIGHTS) {
      expect(["public_domain", "cc", "free"]).toContain(r);
    }
  });
});
