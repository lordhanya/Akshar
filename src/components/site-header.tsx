import Link from "next/link";
import { Bookmark, BookMarked, Library as LibraryIcon, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";

/**
 * Application shell header.
 *
 * Minimal and calm: brand wordmark, a search access point, the theme toggle,
 * and an account / Library action. Discovery grows here without noise.
 */
export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg tracking-tight"
        >
          <BookMarked className="size-5 text-primary" />
          <span>Akshar</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/search">
              <Search data-icon="inline-start" />
              Search
            </Link>
          </Button>
          <ThemeToggle />
          {session?.user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/read-later">
                  <Bookmark data-icon="inline-start" />
                  Read Later
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/library">
                  <LibraryIcon data-icon="inline-start" />
                  Library
                </Link>
              </Button>
            </>
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
