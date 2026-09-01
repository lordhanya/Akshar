import type { ReactNode } from "react";

/**
 * Reader route group — intentionally OUTSIDE the `(app)` shell so the reader
 * has neither the browsing header nor footer. A distraction-free, dedicated
 * reading environment.
 */
export default function ReaderLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
