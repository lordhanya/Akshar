"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, X } from "lucide-react";
import { FilterSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Filter controls for the search page.
 *
 * Only filters reliably supported by the catalog exist here: language,
 * availability (readable vs metadata-only), and free-text genre/author chips
 * via the query. Changing a filter updates the URL so the server re-renders
 * results — no per-keystroke external calls.
 */
export function FilterPanel({
  languages,
  availability,
}: {
  languages: string[];
  availability?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const active = {
    language: params.get("language") ?? "",
    availability: params.get("availability") ?? "",
  };

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  const hasAnyFilter = Boolean(active.language || active.availability);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Filter className="size-4" aria-hidden />
        Filter
      </span>

      <FilterSelect
        value={active.language}
        onValueChange={(v) => update("language", v)}
        placeholder="Language"
        label="Language"
        options={languages.map((l) => ({
          value: l,
          label: languageLabel(l),
        }))}
      />

      <FilterSelect
        value={active.availability}
        onValueChange={(v) => update("availability", v)}
        placeholder="Availability"
        label="Availability"
        options={[
          { value: "readable", label: "Available to read" },
          { value: "metadata-only", label: "Metadata only" },
        ]}
      />

      {hasAnyFilter ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/search")}
          className="text-muted-foreground"
        >
          <X data-icon="inline-start" /> Clear
        </Button>
      ) : null}

      <span className={cn("sr-only", !availability && "hidden")} />
    </div>
  );
}

function languageLabel(code: string): string {
  const map: Record<string, string> = {
    en: "English",
    as: "অসমীয়া",
    hi: "हिन्दी",
    bn: "বাংলা",
    fr: "French",
    de: "German",
    es: "Spanish",
    und: "Unknown",
  };
  return map[code] ?? code.toUpperCase();
}
