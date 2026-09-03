import Link from "next/link";
import { Bookmark, BookMarked, Library as LibraryIcon, LogOut, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { signOut } from "@/lib/sign-out-action";

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
          <Button asChild variant="ghost" size="sm" className="px-2 sm:px-2.5">
            <Link href="/search" aria-label="Search">
              <Search />
              <span className="hidden sm:inline">Search</span>
            </Link>
          </Button>
          <ThemeToggle />
          {session?.user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="px-2 sm:px-2.5">
                <Link href="/read-later" aria-label="Read Later">
                  <Bookmark />
                  <span className="hidden sm:inline">Read Later</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="px-2 sm:px-2.5">
                <Link href="/library" aria-label="Library">
                  <LibraryIcon />
                  <span className="hidden sm:inline">Library</span>
                </Link>
              </Button>
              <form action={signOut}>
                <Button variant="ghost" size="sm" className="px-2 sm:px-2.5" aria-label="Sign out">
                  <LogOut />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </form>
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
