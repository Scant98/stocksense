import path from "node:path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate/studio) should use a direct, non-pooled connection when one
// is provided (Neon: DATABASE_URL_UNPOOLED). The app itself uses DATABASE_URL.
const url =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/stocksense";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: "prisma/migrations",
  },
  datasource: { url },
});
