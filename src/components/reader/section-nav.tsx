"use client";

import { List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReaderSection } from "@/lib/reader/load";
import { cn } from "@/lib/utils";

/**
 * Table of contents — a compact list of sections so the reader always knows
 * "Where am I in this book?" and can jump to any section.
 */
export function SectionNav({
  sections,
  activeIndex,
  onSelect,
}: {
  sections: ReaderSection[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Contents"
          className="gap-1.5"
        >
          <List className="size-4" />
          <span className="hidden sm:inline">Contents</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72">
        <DropdownMenuLabel className="px-2 py-1.5">Contents</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div
          role="listbox"
          aria-label="Sections"
          className="max-h-[50vh] overflow-y-auto py-0.5"
        >
          {sections.map((section, i) => (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => onSelect(i)}
              data-active={i === activeIndex}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                i === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span className="truncate">
                {section.heading || `Section ${i + 1}`}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
