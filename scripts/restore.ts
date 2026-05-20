import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";

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

async function restore(backupPath: string) {
  console.log(`🔄 Restoring from: ${backupPath}\n`);

  if (!fs.existsSync(backupPath)) {
    console.error(`❌ File not found: ${backupPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(backupPath, "utf-8");
  const data: BackupData = JSON.parse(content);

  console.log("⚠️  Clearing existing data...");
  await prisma.invoiceSequence.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleared\n");

  console.log("📥 Restoring data...");
  
  const userMap: Record<string, string> = {};
  for (const user of data.users) {
    const created = await prisma.user.create({ data: user });
    userMap[user.id] = created.id;
    console.log(`  ✓ user: ${user.email}`);
  }

  const categoryMap: Record<string, string> = {};
  for (const cat of data.categories) {
    const created = await prisma.category.create({ data: cat });
    categoryMap[cat.id] = created.id;
    console.log(`  ✓ category: ${cat.name}`);
  }

  const supplierMap: Record<string, string> = {};
  for (const sup of data.suppliers) {
    const created = await prisma.supplier.create({ data: sup });
    supplierMap[sup.id] = created.id;
    console.log(`  ✓ supplier: ${sup.name}`);
  }

  const productMap: Record<string, string> = {};
  for (const prod of data.products) {
    const created = await prisma.product.create({
      data: {
        ...prod,
        categoryId: categoryMap[prod.categoryId] || prod.categoryId,
        supplierId: prod.supplierId ? (supplierMap[prod.supplierId] || prod.supplierId) : undefined,
      },
    });
    productMap[prod.id] = created.id;
    console.log(`  ✓ product: ${prod.name}`);
  }

  for (const tx of data.transactions) {
    await prisma.transaction.create({
      data: {
        ...tx,
        productId: productMap[tx.productId] || tx.productId,
      },
    });
    console.log(`  ✓ transaction: ${tx.reference}`);
  }

  const invoiceMap: Record<string, string> = {};
  for (const inv of data.invoices) {
    const created = await prisma.invoice.create({ data: inv });
    invoiceMap[inv.id] = created.id;
    console.log(`  ✓ invoice: ${inv.invoiceNumber}`);
  }

  for (const item of data.invoiceItems) {
    await prisma.invoiceItem.create({
      data: {
        ...item,
        invoiceId: invoiceMap[item.invoiceId] || item.invoiceId,
      },
    });
    console.log(`  ✓ invoiceItem`);
  }

  for (const sequence of data.invoiceSequences ?? []) {
    await prisma.invoiceSequence.create({ data: sequence });
    console.log(`  ✓ invoiceSequence: ${sequence.key}`);
  }

  await prisma.$disconnect();
  console.log("\n🎉 Restore complete!");
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: tsx scripts/restore.ts <backup-file.json>");
  console.log("Example: tsx scripts/restore.ts backups/backup-2026-04-28T10-30-00-000Z.json");
  process.exit(0);
}

restore(args[0]).catch((e) => {
  console.error("Restore failed:", e);
  process.exit(1);
});
