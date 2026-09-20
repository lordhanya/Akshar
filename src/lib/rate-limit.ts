/**
 * Simple in-memory rate limiter with sliding-window counters.
 *
 * Keyed by an arbitrary string (e.g. "ip:email"). Entries are lazily evicted
 * once their window expires. Good enough for a single-process server; NOT
 * suitable for horizontal scaling without a shared store.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const existing = store.get(key);

  if (existing && now < existing.resetAt) {
    if (existing.count >= maxRequests) {
      return { ok: false, retryAfterMs: existing.resetAt - now };
    }
    existing.count++;
    return { ok: true };
  }

  store.set(key, { count: 1, resetAt: now + windowMs });
  return { ok: true };
}

/**
 * Evict expired entries every 5 minutes to prevent unbounded growth.
 * Safe to call from any request handler; runs at most once per interval.
 */
let lastEviction = 0;
const EVICT_INTERVAL = 5 * 60 * 1000;

export function evictExpiredRateLimitEntries() {
  const now = Date.now();
  if (now - lastEviction < EVICT_INTERVAL) return;
  lastEviction = now;
  for (const [key, window] of store) {
    if (now >= window.resetAt) store.delete(key);
  }
}
