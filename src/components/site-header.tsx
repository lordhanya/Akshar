import Link from "next/link";
import { BookMarked } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";

/**
 * Application shell header.
 *
 * Kept intentionally minimal and calm for Phase 0 — a wordmark, a quiet nav
 * anchor, the theme toggle, and an account action. Discovery/navigation will
 * grow here in later phases.
 */
export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg tracking-tight">
          <BookMarked className="size-5 text-primary" />
          <span>Library</span>
        </Link>

        <nav className="flex items-center gap-1">
          <ThemeToggle />
          {session?.user ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/account">My Library</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
