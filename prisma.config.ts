import path from "node:path";
import "dotenv/config";
import { defineConfig } from "@prisma/config";

const dbPath = "file:./prisma/dev.db";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbPath,
  },
});