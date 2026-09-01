import { SiteHeader } from "@/components/site-header";

/**
 * Application chrome layout for the public "browsing" shell.
 *
 * Kept in a route group so the full-screen reader can later live OUTSIDE this
 * group (thus without the header/footer) for a distraction-free experience.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <p>Free, legally distributable books — a calm digital reading room.</p>
          <p>© {new Date().getFullYear()} Library</p>
        </div>
      </footer>
    </>
  );
}
