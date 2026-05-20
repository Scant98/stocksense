import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const envExamplePath = path.join(root, ".env.example");
const envLocalPath = path.join(root, ".env.local");

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!fs.existsSync(envLocalPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envLocalPath);
  console.log("Created .env.local from .env.example");
}

console.log("Generating Prisma client...");
run("npx", ["prisma", "generate"]);

console.log("Applying migrations...");
run("npx", ["prisma", "migrate", "deploy"]);

console.log("Seeding database...");
run("npx", ["prisma", "db", "seed"]);

console.log("Setup complete.");
