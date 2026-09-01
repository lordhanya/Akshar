"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Debounced search input.
 *
 * Navigates to /search?q=... after the user stops typing (nothing is sent on
 * every keystroke — search itself reads from the local DB catalog). The form
 * also works without JavaScript.
 */
export function SearchBar({
  defaultValue = "",
  className,
  autoFocus,
  placeholder = "Search by title, author, or subject…",
}: {
  defaultValue?: string;
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function submit(q: string) {
    const t = q.trim();
    router.push(t ? `/search?q=${encodeURIComponent(t)}` : "/search");
  }

  function onChange(q: string) {
    setValue(q);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => submit(q), 450);
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <form
      role="search"
      className={cn("flex w-full items-center gap-2", className)}
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-11 rounded-xl pl-9 pr-9 text-base"
          aria-label="Search books"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              if (timer.current) clearTimeout(timer.current);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <Button type="submit" size="lg" className="h-11 rounded-xl">
        Search
      </Button>
    </form>
  );
}
