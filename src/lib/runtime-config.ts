export const DEFAULT_SESSION_SECRET = "stocksense-local-session-secret";

export function getSessionSecret() {
  return process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET;
}
