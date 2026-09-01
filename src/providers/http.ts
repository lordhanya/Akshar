import { ProviderError } from "./types";

/**
 * Shared outbound HTTP for every provider.
 *
 * Centralizes the "polite, identified, server-side" policy called for by
 * Open Library / Project Gutenberg:
 *  - an identified User-Agent
 *  - a hard per-request timeout
 *  - in-flight request deduplication (multiple callers of the same URL share
 *    one network request)
 *  - graceful, typed failure rather than an uncaught throw
 */

const UA = process.env.PROVIDER_USER_AGENT ?? "Library/0.1 (server-side)";
const DEFAULT_TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS ?? 10_000);

/** Map of in-flight (and cached) URL -> promise, for deduplication. */
const inflight = new Map<string, Promise<Response>>();
const responseCache = new Map<
  string,
  { body: string; contentType: string | null; fetchedAt: number }
>();

function cacheKey(url: string, headers: HeadersInit): string {
  return `${url}\u0000${JSON.stringify(headers)}`;
}

function keyToTtlMs(_key: string): number {
  // Small in-memory TTL for metadata-ish GETs (~2 min). Content fetches are
  // large and are cached separately in the DB-backed store, not here.
  return Number(process.env.PROVIDER_CACHE_MS ?? 120_000);
}

export interface HttpOptions {
  headers?: HeadersInit;
  timeoutMs?: number;
  /** Response bodies larger than this are rejected (protects memory). */
  maxBytes?: number;
  /** Skip the in-memory cache (used for large content fetches). */
  noCache?: boolean;
}

export interface HttpResult {
  ok: boolean;
  status: number;
  contentType: string | null;
  body: string;
}

/**
 * Fetch `url` as text with a timeout, dedup, and optional brief caching.
 * Throws `ProviderError("provider_unavailable")` on network/timeout failures.
 */
export async function httpGetText(
  url: string,
  opts: HttpOptions = {},
  source: "openlibrary" | "gutenberg" | "standard_ebooks" = "gutenberg"
): Promise<HttpResult> {
  const headers: HeadersInit = {
    Accept: "application/json, text/plain, */*",
    "User-Agent": UA,
    ...(opts.headers ?? {}),
  };
  const key = cacheKey(url, headers);
  const ttl = keyToTtlMs(key);

  if (!opts.noCache) {
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < ttl) {
      return { ok: true, status: 200, contentType: cached.contentType, body: cached.body };
    }
  }

  const fetchWithTimeout = async (): Promise<Response> => {
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { headers, signal: controller.signal, cache: "no-store" });
    } finally {
      clearTimeout(timer);
    }
  };

  // Deduplicate concurrent identical requests.
  let promise = inflight.get(key);
  if (!promise) {
    promise = fetchWithTimeout();
    inflight.set(key, promise);
    promise.finally(() => inflight.delete(key)).catch(() => {});
  }

  let res: Response;
  try {
    res = await promise;
  } catch (err) {
    throw new ProviderError(
      "provider_unavailable",
      `Request to ${url} failed: ${err instanceof Error ? err.message : String(err)}`,
      source
    );
  }

  if (!res.ok) {
    if (res.status === 429 || res.status === 403) {
      throw new ProviderError("rate_limited", `Rate limited by ${source}: HTTP ${res.status}`, source);
    }
    if (res.status === 404) {
      throw new ProviderError("not_found", `Not found: ${url}`, source);
    }
    throw new ProviderError(
      "provider_unavailable",
      `Provider ${source} returned HTTP ${res.status} (${res.statusText})`,
      source
    );
  }

  const text = await res.text();
  if (opts.maxBytes && text.length > opts.maxBytes) {
    throw new ProviderError(
      "invalid_data",
      `Response from ${url} exceeded ${opts.maxBytes} bytes`,
      source
    );
  }

  if (!opts.noCache) {
    responseCache.set(key, {
      body: text,
      // UTF-8 text; text/plain responses from Gutenberg are ASCII/UTF-8.
      // JSON responses set their own charset.
      contentType: "utf-8",
      fetchedAt: Date.now(),
    });
  }

  return { ok: true, status: res.status, contentType: "utf-8", body: text };
}
