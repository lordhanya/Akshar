import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

/**
 * Application chrome layout for the public "browsing" shell.
 *
 * Kept in a route group so the full-screen reader can later live OUTSIDE this
 * group (thus without the header/footer) for a distraction-free experience.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>Free, legally distributable books — a calm digital reading room.</p>
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-heading">Akshar</span>{" "}
            · Created &amp; developed by{" "}
            <a
              href="https://ashifcodes.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              ashifcodes.tech
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
