/**
 * Availability state for the discovery UI, derived from whether a book is
 * readable (rights permit free distribution) or metadata-only.
 *
 * Kept as pure functions so the label/variant logic can be unit-tested
 * without a component renderer.
 */
export type Availability = "readable" | "metadata-only";

export function availabilityFromReadable(readable: boolean): Availability {
  return readable ? "readable" : "metadata-only";
}

export function availabilityLabel(availability: Availability): string {
  switch (availability) {
    case "readable":
      return "Available to read";
    case "metadata-only":
      return "Metadata only";
  }
}
