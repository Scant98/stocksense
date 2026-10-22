const DEV_SESSION_SECRET = "stocksense-local-session-secret";

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }
  return DEV_SESSION_SECRET;
}
