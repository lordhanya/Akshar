/**
 * Reading progress model and calculation.
 *
 * Pure, provider-agnostic functions over the normalized content model. The
 * reader locator is `{ section, offset }`: `section` is the index into the
 * normalized `sections` array and `offset` is a 0..1 fraction of how far the
 * reader has passed through that section. This survives format/provider
 * changes because it never references a provider-specific URL or element id.
 */

/** Deterministic, provider-agnostic reading locator. */
export interface ReaderLocator {
  /** Schema version — bump if the shape ever changes. */
  v: 1;
  /** Index into the normalized sections array. */
  section: number;
  /** 0..1 fraction of the way through the current section. */
  offset: number;
}

/** A persisted reading position (local or server). */
export interface ReaderProgress {
  locator: ReaderLocator;
  /** 0..1 fraction of the book read. */
  pct: number;
  /** Epoch milliseconds of the last update. Used for conflict resolution. */
  updatedAt: number;
}

export type ProgressSource = "local" | "server";

const clamp = (n: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, n));

/** Sanitize an offset into the 0..1 range. */
export function clampOffset(offset: number): number {
  return Number.isFinite(offset) ? clamp(offset, 0, 1) : 0;
}

/** Sanitize a section index to a valid non-negative integer. */
export function normalizeSection(section: number, sectionCount: number): number {
  const s = Number.isFinite(section) ? Math.floor(section) : 0;
  if (sectionCount <= 0) return 0;
  return Math.min(sectionCount - 1, Math.max(0, s));
}

const DEFAULT_SECTION = { v: 1, section: 0, offset: 0 } as const satisfies ReaderLocator;

/** The locator a reader starts at when there is no saved progress. */
export function initialLocator(): ReaderLocator {
  return { ...DEFAULT_SECTION };
}

interface SectionLike {
  heading?: string | null;
  paragraphs?: string[];
}

/** Per-section weight (character count) used for content-weighted progress. */
export function sectionWeights(sections: SectionLike[]): number[] {
  return sections.map((s) => {
    let w = s.heading ? s.heading.length : 0;
    if (Array.isArray(s.paragraphs)) {
      for (const p of s.paragraphs) w += p ? p.length : 0;
    }
    return w;
  });
}

export function totalWeight(weights: number[]): number {
  return weights.reduce((acc, w) => acc + (w || 0), 0);
}

/**
 * Content-weighted reading percentage (0..1), rounded to 0.1% so it is
 * deterministic and stable — it moves only with meaningful scroll changes,
 * not on every pixel.
 */
export function computePct(
  weights: number[],
  section: number,
  offset: number
): number {
  const total = totalWeight(weights);
  if (total <= 0) return 0;
  const s = normalizeSection(section, weights.length);
  const o = clampOffset(offset);
  let done = 0;
  for (let i = 0; i < s; i++) done += weights[i] || 0;
  done += (weights[s] || 0) * o;
  const pct = clamp(done / total);
  // Round to 0.1% granularity for a calm, trustworthy read-out.
  return Math.round(pct * 1000) / 1000;
}

/**
 * Resolve which saved progress to resume from when both a local (anonymous)
 * copy and a server (authenticated) copy exist. The newer position wins; ties
 * prefer the server since it is the most likely to have a cross-device
 * update. The returned source lets the caller persist the winner to the loser
 * store (migration / reconcile).
 */
export function resolveResume(
  local: ReaderProgress | null | undefined,
  server: ReaderProgress | null | undefined
): { progress: ReaderProgress | null; source: ProgressSource } {
  if (!local && !server) return { progress: null, source: "server" };
  if (!server) return { progress: local!, source: "local" };
  if (!local) return { progress: server, source: "server" };
  if (server.updatedAt >= local.updatedAt) {
    return { progress: server, source: "server" };
  }
  return { progress: local, source: "local" };
}

/** Format a confidence-friendly whole-number percentage for display. */
export function percentLabel(pct: number): number {
  return Math.round(clamp(pct, 0, 1) * 100);
}
