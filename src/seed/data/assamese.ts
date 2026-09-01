import type { SeedBook } from "@/seed/types";

/**
 * Assamese curated catalogue.
 *
 * INTENTIONALLY EMPTY for Phase 1.
 *
 * On 2026-09-01 the approved providers were checked for verifiable Assamese
 * public-domain content:
 *   - Project Gutenberg / Gutendex: 0 Assamese-language records (`languages=as`).
 *   - Open Library: 0 Assamese-language works (`language=asm`).
 *   - Standard Ebooks: publishes public-domain works but none in Assamese.
 *
 * Per the plan's explicit guardrails we do NOT fabricate metadata or assume a
 * book is public domain because it appears in an external catalogue. The seed
 * system and schema are fully wired for Assamese records (rights enum includes
 * `public_domain`/`cc`; language `as` is supported) — a verified import (e.g.
 * curated Assamese Wikisource texts with confirmed rights) can be added here in
 * a later phase once each title has a traceable source and verified rights.
 *
 * The result is a deliberate, honest choice: fewer books, not questionable ones.
 */
export const assameseSeed: SeedBook[] = [];
