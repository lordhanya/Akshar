import { BookOpen, Library as LibraryIcon } from "lucide-react";

/**
 * Phase 0 home screen.
 *
 * A quiet placeholder for the working foundation. Discovery, search, featured
 * books and the Assamese section arrive in Phase 1–2. This page exists to
 * confirm the app shell, theming and auth are wired and healthy.
 */
export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <BookOpen className="size-7" />
      </div>

      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        A calm place to read.
      </h1>

      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
        A web-first digital reading room with strong book discovery and
        regional-language support — free, and always in your pocket.
      </p>

      <div className="mt-8 w-full max-w-sm rounded-2xl border bg-card p-5 text-left text-sm text-muted-foreground">
        <div className="mb-3 flex items-center gap-2 font-heading text-foreground">
          <LibraryIcon className="size-4" /> Foundation ready
        </div>
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="text-primary">✓</span> App shell, theming & typography
          </li>
          <li className="flex gap-2">
            <span className="text-primary">✓</span> Light / sepia / dark reading modes
          </li>
          <li className="flex gap-2">
            <span className="text-primary">✓</span> Accounts (email + password)
          </li>
          <li className="flex gap-2">
            <span className="text-primary">✓</span> Database schema & migrations
          </li>
        </ul>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Book discovery and the reader arrive in the next phase.
      </p>
    </section>
  );
}
