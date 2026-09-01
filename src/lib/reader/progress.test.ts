import { describe, it, expect } from "vitest";
import {
  computePct,
  sectionWeights,
  totalWeight,
  clampOffset,
  normalizeSection,
  initialLocator,
  resolveResume,
  type ReaderProgress,
} from "./progress";

const sections = [{ heading: "A", paragraphs: ["xxxxx"] }, { heading: null, paragraphs: ["yyyyyy"] }];

describe("sectionWeights / totalWeight", () => {
  it("weighs sections by character count (heading + paragraphs)", () => {
    const weights = sectionWeights(sections);
    // A: "A"(1) + "xxxxx"(5) = 6; B: "yyyyyy"(6) = 6
    expect(weights).toEqual([6, 6]);
    expect(totalWeight(weights)).toBe(12);
  });
});

describe("computePct", () => {
  it("is 0 at the very start", () => {
    expect(computePct([6, 6], 0, 0)).toBe(0);
  });

  it("is deterministic and content-weighted", () => {
    const weights = [6, 6];
    // Halfway through section 0 (offset .5): done = 6*.5=3 of 12 => .25
    expect(computePct(weights, 0, 0.5)).toBe(0.25);
    // Start of section 1: done = 6 of 12 => .5
    expect(computePct(weights, 1, 0)).toBe(0.5);
    // End of section 1: 1.0
    expect(computePct(weights, 1, 1)).toBe(1);
  });

  it("clamps out-of-range offsets", () => {
    expect(computePct([10], 0, 5)).toBe(1);
    expect(computePct([10], 0, -2)).toBe(0);
  });

  it("normalizes an out-of-range section index", () => {
    const weights = [6, 6];
    // section 99 clamped to last section (1) at offset 0 => 0.5
    expect(computePct(weights, 99, 0)).toBe(0.5);
    // section -3 clamped to 0 at offset 0 => 0
    expect(computePct(weights, -3, 0)).toBe(0);
  });

  it("is stable (does not recompute wildly for small changes)", () => {
    const weights = [100, 100];
    const a = computePct(weights, 0, 0.3333333);
    const b = computePct(weights, 0, 0.3333334);
    expect(a).toBe(b); // rounded to 0.1%
  });

  it("returns 0 when there is no content weight", () => {
    expect(computePct([0, 0], 0, 0.5)).toBe(0);
    expect(computePct([], 0, 0.5)).toBe(0);
  });
});

describe("clampOffset / normalizeSection / initialLocator", () => {
  it("clamps offsets to 0..1 and rejects NaN", () => {
    expect(clampOffset(1.5)).toBe(1);
    expect(clampOffset(-1)).toBe(0);
    expect(clampOffset(0.4)).toBe(0.4);
    expect(clampOffset(Number.NaN)).toBe(0);
  });

  it("normalizes section indices within bounds", () => {
    expect(normalizeSection(2, 5)).toBe(2);
    expect(normalizeSection(9, 5)).toBe(4);
    expect(normalizeSection(-1, 5)).toBe(0);
    expect(normalizeSection(0, 0)).toBe(0);
  });

  it("returns a beginning locator by default", () => {
    expect(initialLocator()).toEqual({ v: 1, section: 0, offset: 0 });
  });
});

function prog(updatedAt: number, section = 0): ReaderProgress {
  return { locator: { v: 1, section, offset: 0 }, pct: 0, updatedAt };
}

describe("resolveResume (conflict handling)", () => {
  it("returns nothing when there is no progress anywhere", () => {
    expect(resolveResume(null, null)).toEqual({
      progress: null,
      source: "server",
    });
  });

  it("uses local when only local exists", () => {
    const local = prog(100);
    expect(resolveResume(local, null)).toEqual({
      progress: local,
      source: "local",
    });
  });

  it("uses server when only server exists", () => {
    const server = prog(200, 3);
    expect(resolveResume(null, server)).toEqual({
      progress: server,
      source: "server",
    });
  });

  it("prefers the newer position when both exist", () => {
    const local = prog(100, 2);
    const server = prog(300, 4);
    expect(resolveResume(local, server).progress).toBe(server);
    expect(resolveResume(server, local).progress).toBe(server);
  });

  it("prefers server on a tie", () => {
    const local = prog(100, 2);
    const server = prog(100, 4);
    const r = resolveResume(local, server);
    expect(r.source).toBe("server");
    expect(r.progress).toBe(server);
  });
});
