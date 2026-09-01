"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  THEMES,
  FONT_SIZES,
  LINE_HEIGHTS,
  READING_WIDTHS,
  sizeLabel,
  type ReaderSettings,
  type ReaderTheme,
} from "@/lib/reader/settings";
import { cn } from "@/lib/utils";

/**
 * The compact "Aa" reading control.
 *
 * One small popover holds everything: theme, font size, line height and
 * reading width. It disappears when the reader is not reading settings, so
 * the surface stays calm.
 */
export function ReaderSettingsControl({
  settings,
  onChange,
}: {
  settings: ReaderSettings;
  onChange: (next: ReaderSettings) => void;
}) {
  const themeLabels: Record<ReaderTheme, string> = {
    light: "Light",
    sepia: "Sepia",
    dark: "Dark",
  };

  const canDec = {
    size: settings.size > 0,
    lineHeight: settings.lineHeight > 0,
    width: settings.width > 0,
  };
  const canInc = {
    size: settings.size < FONT_SIZES.length - 1,
    lineHeight: settings.lineHeight < LINE_HEIGHTS.length - 1,
    width: settings.width < READING_WIDTHS.length - 1,
  };

  function change(key: "size" | "lineHeight" | "width", delta: number) {
    onChange({ ...settings, [key]: settings[key] + delta });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Reading settings">
          Aa
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-2">
        <DropdownMenuLabel>Reading theme</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 px-1 pb-1">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ ...settings, theme: t })}
              aria-pressed={settings.theme === t}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                settings.theme === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {themeLabels[t]}
            </button>
          ))}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Font size</DropdownMenuLabel>
        <Stepper
          label={sizeLabel(settings.size)}
          onDec={() => change("size", -1)}
          onInc={() => change("size", 1)}
          canDec={canDec.size}
          canInc={canInc.size}
        />

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Line spacing</DropdownMenuLabel>
        <Stepper
          label={String(LINE_HEIGHTS[settings.lineHeight])}
          onDec={() => change("lineHeight", -1)}
          onInc={() => change("lineHeight", 1)}
          canDec={canDec.lineHeight}
          canInc={canInc.lineHeight}
        />

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Reading width</DropdownMenuLabel>
        <Stepper
          label={`${READING_WIDTHS[settings.width]}rem`}
          onDec={() => change("width", -1)}
          onInc={() => change("width", 1)}
          canDec={canDec.width}
          canInc={canInc.width}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Stepper({
  label,
  onDec,
  onInc,
  canDec,
  canInc,
}: {
  label: string;
  onDec: () => void;
  onInc: () => void;
  canDec: boolean;
  canInc: boolean;
}) {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onDec}
        disabled={!canDec}
        aria-label="Decrease"
      >
        <Minus />
      </Button>
      <span className="min-w-16 flex-1 text-center text-sm tabular-nums text-foreground">
        {label}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onInc}
        disabled={!canInc}
        aria-label="Increase"
      >
        <Plus />
      </Button>
    </div>
  );
}
