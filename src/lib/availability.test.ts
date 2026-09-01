import { describe, it, expect } from "vitest";
import {
  availabilityFromReadable,
  availabilityLabel,
} from "./availability";

describe("availabilityFromReadable", () => {
  it("maps readable to 'readable'", () => {
    expect(availabilityFromReadable(true)).toBe("readable");
  });

  it("maps non-readable to 'metadata-only'", () => {
    expect(availabilityFromReadable(false)).toBe("metadata-only");
  });
});

describe("availabilityLabel", () => {
  it("labels readable books", () => {
    expect(availabilityLabel("readable")).toBe("Available to read");
  });

  it("labels metadata-only books", () => {
    expect(availabilityLabel("metadata-only")).toBe("Metadata only");
  });
});
