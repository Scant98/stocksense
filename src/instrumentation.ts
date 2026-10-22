export function register() {
  // Vercel functions run in UTC. The shop thinks in local time ("today's sales",
  // monthly buckets), so pin the process timezone before any request is served.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = process.env.SHOP_TIMEZONE || "Africa/Dar_es_Salaam";
  }
}
