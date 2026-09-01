"use client";

import { useTheme } from "next-themes";
import { Moon, SunMedium, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const modes = [
  { value: "light", label: "Light", icon: SunMedium },
  { value: "sepia", label: "Sepia", icon: BookOpen },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

/**
 * Cycles the reading theme between Light / Sepia / Dark.
 * Sepia is the platform's signature comfortable reading mode.
 */
export function ThemeToggle({
  className,
}: {
  className?: string;
}) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className} aria-label="Reading theme">
          <SunMedium className="size-5 dark:hidden sepia:hidden" />
          <BookOpen className="size-5 hidden sepia:inline" />
          <Moon className="size-5 hidden dark:inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {modes.map((mode) => (
          <DropdownMenuItem
            key={mode.value}
            onClick={() => setTheme(mode.value)}
          >
            <mode.icon className="mr-2 size-4" />
            {mode.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
