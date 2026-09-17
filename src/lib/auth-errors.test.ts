import { describe, it, expect } from "vitest";
import { friendlySignInError, friendlySignUpError } from "./auth-errors";

describe("friendlySignInError", () => {
  it("keeps invalid email-or-password generic (no user enumeration)", () => {
    const msg = friendlySignInError("INVALID_EMAIL_OR_PASSWORD");
    expect(msg).toContain("Incorrect email or password");
  });

  it("treats user-not-found and invalid-password identically", () => {
    const a = friendlySignInError("USER_NOT_FOUND");
    const b = friendlySignInError("INVALID_PASSWORD");
    const c = friendlySignInError("INVALID_EMAIL_OR_PASSWORD");
    expect(a).toBe(b);
    expect(a).toBe(c);
  });

  it("never leaks internal server errors like invalid origin", () => {
    expect(friendlySignInError("INVALID_ORIGIN")).not.toContain("origin");
    expect(friendlySignInError("FAILED_TO_CREATE_SESSION")).not.toContain(
      "failed",
    );
  });

  it("falls back to a generic message for unknown codes", () => {
    const msg = friendlySignInError("SOME_UNKNOWN_CODE");
    expect(msg).toBe("Something went wrong. Please try again.");
  });

  it("falls back to a generic message when no code is given", () => {
    expect(friendlySignInError(undefined)).toBe(
      "Something went wrong. Please try again.",
    );
  });
});

describe("friendlySignUpError", () => {
  it("tells the user the email already has an account", () => {
    expect(friendlySignUpError("USER_ALREADY_EXISTS")).toContain(
      "this email already exists",
    );
  });

  it("explains password length rules", () => {
    expect(friendlySignUpError("PASSWORD_TOO_SHORT")).toContain("at least 8");
  });

  it("never leaks internal server errors like invalid origin", () => {
    expect(friendlySignUpError("INVALID_ORIGIN")).not.toContain("origin");
    expect(friendlySignUpError("FAILED_TO_CREATE_USER")).not.toContain(
      "failed",
    );
  });

  it("falls back to a generic message for unknown codes", () => {
    expect(friendlySignUpError("WHATEVER")).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("falls back to a generic message when no code is given", () => {
    expect(friendlySignUpError(null)).toBe(
      "Something went wrong. Please try again.",
    );
  });
});