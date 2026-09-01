import { createAuthClient } from "better-auth/client";

/**
 * Framework-agnostic Better Auth client used on the client side.
 *
 * Prefixed under the app's auth base path ("/api/auth"). Uses cookies for
 * session management via the server-side nextCookies plugin.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
