/**
 * Human-readable labels for language codes. The label for Assamese (`as`)
 * is rendered in Assamese script on the discovery UI.
 */
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  as: "অসমীয়া",
  bn: "বাংলা",
  hi: "हिन्दी",
  ur: "اردو",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  ru: "Русский",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  ar: "العربية",
  und: "Unknown",
};

/** Fallback: uppercase the code so an unknown language is still identifiable. */
export function languageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code.toUpperCase();
}
