import { describe, it, expect } from "vitest";
import {
  progressKey,
  parseStoredProgress,
  serializeProgress,
} from "./storage";
import type { ReaderProgress } from "./progress";

describe("progressKey", () => {
  it("namespaces by book id", () => {
    expect(progressKey("gut-11")).toBe("kitap:progress:gut-11");
  });
});

describe("parseStoredProgress", () => {
  it("returns null for empty input", () => {
    expect(parseStoredProgress(null)).toBeNull();
    expect(parseStoredProgress("")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseStoredProgress("{not json")).toBeNull();
  });

  it("returns null when locator or pct is missing", () => {
    expect(parseStoredProgress('{"pct":0.5}')).toBeNull();
    expect(parseStoredProgress('{"locator":{"section":0}}')).toBeNull();
  });

  it("parses a valid progress value", () => {
    const p = parseStoredProgress(
      JSON.stringify({
        locator: { v: 1, section: 2, offset: 0.4 },
        pct: 0.5,
        updatedAt: 1234,
      })
    );
    expect(p).toEqual({
      locator: { v: 1, section: 2, offset: 0.4 },
      pct: 0.5,
      updatedAt: 1234,
    });
  });

  it("clamps out-of-range section and offset", () => {
    const p = parseStoredProgress(
      JSON.stringify({ locator: { section: -1, offset: 7 }, pct: 4, updatedAt: 1 })
    );
    expect(p!.locator.section).toBe(0);
    expect(p!.locator.offset).toBe(1);
    expect(p!.pct).toBe(1);
  });
});

describe("serializeProgress", () => {
  it("round-trips through parse", () => {
    const p: ReaderProgress = {
      locator: { v: 1, section: 3, offset: 0.25 },
      pct: 0.33,
      updatedAt: 9999,
    };
    expect(parseStoredProgress(serializeProgress(p))).toEqual(p);
  });
});
