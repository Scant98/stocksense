import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = process.env.LIBSQL_EMBEDDED_URL?.replace("file:", "") || "prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

interface BackupData {
  users: Awaited<ReturnType<typeof prisma.user.findMany>>;
  categories: Awaited<ReturnType<typeof prisma.category.findMany>>;
  suppliers: Awaited<ReturnType<typeof prisma.supplier.findMany>>;
  products: Awaited<ReturnType<typeof prisma.product.findMany>>;
  transactions: Awaited<ReturnType<typeof prisma.transaction.findMany>>;
  invoices: Awaited<ReturnType<typeof prisma.invoice.findMany>>;
  invoiceItems: Awaited<ReturnType<typeof prisma.invoiceItem.findMany>>;
  invoiceSequences: Awaited<ReturnType<typeof prisma.invoiceSequence.findMany>>;
}

async function exportAll() {
  console.log("📦 Exporting data from Turso...\n");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const data: BackupData = {
    users: await prisma.user.findMany(),
    categories: await prisma.category.findMany(),
    suppliers: await prisma.supplier.findMany(),
    products: await prisma.product.findMany(),
    transactions: await prisma.transaction.findMany(),
    invoices: await prisma.invoice.findMany(),
    invoiceItems: await prisma.invoiceItem.findMany(),
    invoiceSequences: await prisma.invoiceSequence.findMany(),
  };

  console.log(`✓ users: ${data.users.length}`);
  console.log(`✓ categories: ${data.categories.length}`);
  console.log(`✓ suppliers: ${data.suppliers.length}`);
  console.log(`✓ products: ${data.products.length}`);
  console.log(`✓ transactions: ${data.transactions.length}`);
  console.log(`✓ invoices: ${data.invoices.length}`);
  console.log(`✓ invoiceItems: ${data.invoiceItems.length}`);
  console.log(`✓ invoiceSequences: ${data.invoiceSequences.length}`);

  const jsonPath = path.join(backupDir, `backup-${timestamp}.json`);
  const sqlPath = path.join(backupDir, `backup-${timestamp}.sql`);

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ JSON backup: backups/backup-${timestamp}.json`);

  const sql = generateSQL(data);
  fs.writeFileSync(sqlPath, sql);
  console.log(`✅ SQL backup: backups/backup-${timestamp}.sql`);

  await prisma.$disconnect();
  console.log("\n🎉 Backup complete!");
}

function generateSQL(data: BackupData): string {
  const lines: string[] = [
    "-- StockSense Database Backup",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Source: Turso Cloud Database",
    "",
  ];

  const insertRecords = (table: string, records: unknown[]) => {
    if (records.length === 0) return;
    lines.push(`-- Table: ${table}`);
    lines.push(`DELETE FROM ${table};`);
    for (const record of records as Record<string, unknown>[]) {
      const cols = Object.keys(record);
      const vals = cols.map((c) => {
        const v = record[c];
        if (v === null) return "NULL";
        if (typeof v === "number") return String(v);
        if (typeof v === "boolean") return v ? "1" : "0";
        if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
        if (v instanceof Date) return `'${v.toISOString()}'`;
        return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
      });
      lines.push(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${vals.join(", ")});`);
    }
    lines.push("");
  };

  insertRecords("user", data.users);
  insertRecords("category", data.categories);
  insertRecords("supplier", data.suppliers);
  insertRecords("product", data.products);
  insertRecords("transaction", data.transactions);
  insertRecords("invoice", data.invoices);
  insertRecords("invoiceItem", data.invoiceItems);
  insertRecords("InvoiceSequence", data.invoiceSequences);

  return lines.join("\n");
}

exportAll().catch((e) => {
  console.error("Export failed:", e);
  process.exit(1);
});
