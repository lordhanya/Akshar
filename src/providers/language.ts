/**
 * Language normalization shared by all providers.
 *
 * Each provider reports languages differently:
 *  - Gutendex: ISO 639-1, e.g. "en", "as"
 *  - Open Library: MARC-ish ISO 639-3, e.g. "eng", "asm"
 *  - Standard Ebooks: rarely multilingual, usually one tag
 *
 * We standardize on ISO 639-1 (2-letter) so the catalog is consistent for
 * language filtering and seeding.
 */

type Mapping = Record<string, string>;

const MARC_TO_ISO6391: Mapping = {
  eng: "en",
  asm: "as",
  hin: "hi",
  ben: "bn",
  per: "fa",
  urd: "ur",
  san: "sa",
  fra: "fr",
  fre: "fr",
  spa: "es",
  deu: "de",
  ger: "de",
  ita: "it",
  rus: "ru",
  por: "pt",
  nld: "nl",
  dut: "nl",
  zho: "zh",
  chi: "zh",
  jpn: "ja",
  kor: "ko",
  ara: "ar",
  grc: "grc",
  lat: "la",
  tam: "ta",
  tel: "te",
  mar: "mr",
  guj: "gu",
  pan: "pa",
  ori: "or",
  kan: "kn",
  mal: "ml",
  nep: "ne",
};

/** Map any of the supported input tags to ISO 639-1; fall back to input. */
export function normalizeLanguage(code: string | undefined | null): string {
  if (!code) return "und";
  const c = code.trim().toLowerCase();
  if (/^[a-z]{2}$/.test(c)) return c; // already ISO 639-1
  if (/^[a-z]{3}$/.test(c)) return MARC_TO_ISO6391[c] ?? code.toLowerCase();
  // e.g. "en-US" -> "en"
  const primary = c.split(/[-_]/)[0];
  if (primary && /^[a-z]{2}$/.test(primary)) return primary;
  return code.toLowerCase();
}
