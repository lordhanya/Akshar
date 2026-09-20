/**
 * Maps raw Better Auth error codes to safe, user-friendly UI messages.
 *
 * We never pass `error.message` directly to the UI: the server may surface
 * internal strings ("Failed to create user", "Invalid origin", etc.) that
 * would leak implementation detail or confuse users. Instead, we key off
 * the stable error code string and return a hand-written message that
 * tells the user *how to recover*, not what went wrong internally.
 *
 * Unknown codes fall through to a generic fallback so that no server
 * detail can ever bleed through, even if a new error code is introduced.
 */

const SIGN_IN_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password. Please try again.",
  INVALID_PASSWORD: "Incorrect email or password. Please try again.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_USER: "Incorrect email or password. Please try again.",
  USER_NOT_FOUND: "Incorrect email or password. Please try again.",
  EMAIL_NOT_VERIFIED:
    "Please verify your email address before signing in.",
  EMAIL_PASSWORD_DISABLED:
    "Email sign-in is currently unavailable. Please contact support.",
  SESSION_EXPIRED:
    "Your session has expired. Please sign in again.",
  INVALID_ORIGIN:
    "Something went wrong. Please try again.",
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED:
    "Something went wrong. Please try again.",
  FAILED_TO_CREATE_SESSION:
    "Something went wrong. Please try again.",
};

const SIGN_UP_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: "An account with this email already exists.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account with this email already exists.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  PASSWORD_TOO_LONG: "Password is too long.",
  INVALID_PASSWORD: "Please choose a stronger password.",
  FAILED_TO_CREATE_USER: "Something went wrong. Please try again.",
  EMAIL_PASSWORD_SIGN_UP_DISABLED:
    "Account creation is currently unavailable. Please contact support.",
  INVALID_ORIGIN: "Something went wrong. Please try again.",
  SESSION_EXPIRED: "Session expired. Please try again.",
};

const RESET_PASSWORD_MESSAGES: Record<string, string> = {
  INVALID_TOKEN:
    "This reset link has expired or is invalid. Please request a new one.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  PASSWORD_TOO_LONG: "Password is too long.",
  INVALID_PASSWORD: "Please choose a stronger password.",
  USER_NOT_FOUND: "Something went wrong. Please try again.",
};

const GENERIC = "Something went wrong. Please try again.";

export function friendlySignInError(code?: string | null): string {
  if (!code) return GENERIC;
  return SIGN_IN_MESSAGES[code] ?? GENERIC;
}

export function friendlySignUpError(code?: string | null): string {
  if (!code) return GENERIC;
  return SIGN_UP_MESSAGES[code] ?? GENERIC;
}

export function friendlyResetPasswordError(code?: string | null): string {
  if (!code) return GENERIC;
  return RESET_PASSWORD_MESSAGES[code] ?? GENERIC;
}
