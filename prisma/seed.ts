import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ean13CheckDigit } from "../src/lib/barcode";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env"), override: true });

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  console.log("Cleaning existing data...");
  await prisma.sale.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.invoiceSequence.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  console.log("Done. Seeding electrical tools shop...");

  // Admin user
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "danieldenho9@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword },
    create: {
      name: "Daniel K.",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("User:", user.email);

  // Categories
  const [powerTools, handTools, electrical, lighting, safety, measuring] = await Promise.all([
    prisma.category.create({ data: { name: "Power Tools",            color: "#F59E0B", icon: "Drill" } }),
    prisma.category.create({ data: { name: "Hand Tools",             color: "#6366F1", icon: "Wrench" } }),
    prisma.category.create({ data: { name: "Electrical Components",  color: "#10B981", icon: "Zap" } }),
    prisma.category.create({ data: { name: "Lighting & Fixtures",    color: "#FBBF24", icon: "Lightbulb" } }),
    prisma.category.create({ data: { name: "Safety Equipment",       color: "#F43F5E", icon: "Shield" } }),
    prisma.category.create({ data: { name: "Measuring Instruments",  color: "#3B82F6", icon: "Gauge" } }),
  ]);
  console.log("Categories: 6");

  // Suppliers
  const [powerPro, electroHub, lightMaster, safeGuard, techMeasure] = await Promise.all([
    prisma.supplier.create({ data: { name: "PowerPro Tools Tanzania",    email: "orders@powerpro.co.tz",      phone: "+255 22 123 4567", address: "45 Industrial Zone, Dar es Salaam",  country: "Tanzania", rating: 4.8, totalOrders: 164, status: "active" } }),
    prisma.supplier.create({ data: { name: "ElectroHub Supplies Ltd",    email: "supply@electrohub.co.tz",    phone: "+255 22 456 7890", address: "12 Biashara Street, Dar es Salaam",  country: "Tanzania", rating: 4.6, totalOrders: 231, status: "active" } }),
    prisma.supplier.create({ data: { name: "LightMaster East Africa",    email: "info@lightmaster.co.tz",     phone: "+255 28 789 0123", address: "78 Kenyatta Road, Mwanza",           country: "Tanzania", rating: 4.3, totalOrders: 95,  status: "active" } }),
    prisma.supplier.create({ data: { name: "SafeGuard Equipment Tanzania", email: "sales@safeguard.co.tz",   phone: "+255 22 234 5678", address: "8 TAZARA Road, Dar es Salaam",       country: "Tanzania", rating: 4.5, totalOrders: 72,  status: "active" } }),
    prisma.supplier.create({ data: { name: "TechMeasure Africa Ltd",     email: "orders@techmeasure.co.tz",   phone: "+255 22 345 6789", address: "22 Nyerere Road, Dar es Salaam",    country: "Tanzania", rating: 4.7, totalOrders: 118, status: "active" } }),
  ]);
  console.log("Suppliers: 5");

  // Products
  const productData = [
    // Power Tools
    { name: "Bosch GSB 13 RE Corded Drill 600W",     sku: "PT-BSH-GSB13-001",   categoryId: powerTools.id, supplierId: powerPro.id,    quantity: 45, reorderPoint: 10, unitPrice: 95000,  sellingPrice: 140000, status: "in_stock",    location: "Shelf A-01", description: "600W corded impact drill, 13mm keyless chuck, 2 speeds" },
    { name: "Makita GA4530 Angle Grinder 4.5\"",     sku: "PT-MAK-GA4530-002",  categoryId: powerTools.id, supplierId: powerPro.id,    quantity: 30, reorderPoint: 8,  unitPrice: 110000, sellingPrice: 165000, status: "in_stock",    location: "Shelf A-02", description: "720W angle grinder, 115mm disc, variable speed" },
    { name: "Bosch GBH 2-26 Rotary Hammer Drill",    sku: "PT-BSH-GBH226-003",  categoryId: powerTools.id, supplierId: powerPro.id,    quantity: 8,  reorderPoint: 5,  unitPrice: 220000, sellingPrice: 320000, status: "warning",     location: "Shelf A-03", description: "800W SDS-plus rotary hammer, 2.7J impact energy" },
    { name: "Milwaukee M18 Cordless Drill Set",       sku: "PT-MLW-M18-004",     categoryId: powerTools.id, supplierId: powerPro.id,    quantity: 15, reorderPoint: 5,  unitPrice: 280000, sellingPrice: 420000, status: "in_stock",    location: "Shelf A-04", description: "18V brushless drill/driver, 2x 5.0Ah batteries, charger & case" },
    { name: "DeWalt DCS391 Circular Saw 165mm",       sku: "PT-DWT-DCS391-005",  categoryId: powerTools.id, supplierId: powerPro.id,    quantity: 0,  reorderPoint: 4,  unitPrice: 195000, sellingPrice: 290000, status: "out_of_stock", location: "Shelf A-05", description: "18V XR circular saw, 165mm blade, 0–50° bevel" },
    // Hand Tools
    { name: "Stanley Screwdriver Set 8-Piece",        sku: "HT-STN-SD8-006",    categoryId: handTools.id,  supplierId: electroHub.id,  quantity: 60, reorderPoint: 15, unitPrice: 25000,  sellingPrice: 38000,  status: "in_stock",    location: "Shelf B-01", description: "8-piece: 4 flat + 4 Phillips, soft-grip handles" },
    { name: "Combination Wrench Set 8–22mm",          sku: "HT-STN-CWS-007",    categoryId: handTools.id,  supplierId: electroHub.id,  quantity: 40, reorderPoint: 10, unitPrice: 45000,  sellingPrice: 68000,  status: "in_stock",    location: "Shelf B-02", description: "7-piece metric combination wrench set, drop-forged steel" },
    { name: "Knipex Lineman's Pliers 8\"",            sku: "HT-KNP-LP8-008",    categoryId: handTools.id,  supplierId: electroHub.id,  quantity: 3,  reorderPoint: 8,  unitPrice: 35000,  sellingPrice: 55000,  status: "low_stock",   location: "Shelf B-03", description: "200mm combination pliers, chrome-vanadium steel" },
    { name: "Wire Stripper & Cable Cutter 6\"",       sku: "HT-STN-WSC-009",    categoryId: handTools.id,  supplierId: electroHub.id,  quantity: 50, reorderPoint: 12, unitPrice: 18000,  sellingPrice: 28000,  status: "in_stock",    location: "Shelf B-04", description: "Multi-function wire stripper, cutter & crimper, 10–24 AWG" },
    // Electrical Components
    { name: "2.5mm² Twin & Earth Cable (100m)",       sku: "EC-CAB-25TE-010",   categoryId: electrical.id, supplierId: electroHub.id,  quantity: 80, reorderPoint: 20, unitPrice: 85000,  sellingPrice: 125000, status: "in_stock",    location: "Rack C-01",  description: "2.5mm² PVC twin & earth cable, 100m roll, BS 6004" },
    { name: "16A Single Socket Outlet (Pack 10)",     sku: "EC-SCK-16A-011",    categoryId: electrical.id, supplierId: electroHub.id,  quantity: 120,reorderPoint: 25, unitPrice: 18000,  sellingPrice: 28000,  status: "in_stock",    location: "Rack C-02",  description: "16A BS socket, white, with safety shutters, pack of 10" },
    { name: "Schneider 32A Single Pole MCB",          sku: "EC-MCB-32A-012",    categoryId: electrical.id, supplierId: electroHub.id,  quantity: 0,  reorderPoint: 30, unitPrice: 8500,   sellingPrice: 14000,  status: "out_of_stock", location: "Rack C-03",  description: "32A single pole MCB, 6kA, Type C, DIN rail mount" },
    { name: "4mm² Earth Cable Green/Yellow (100m)",   sku: "EC-CAB-4GY-013",    categoryId: electrical.id, supplierId: electroHub.id,  quantity: 12, reorderPoint: 15, unitPrice: 95000,  sellingPrice: 145000, status: "warning",     location: "Rack C-04",  description: "4mm² PVC earth cable, green/yellow, 100m roll" },
    // Lighting
    { name: "LED Bulb 15W E27 Cool White (Pack 10)",  sku: "LT-LED-15W-014",    categoryId: lighting.id,   supplierId: lightMaster.id, quantity: 150,reorderPoint: 30, unitPrice: 28000,  sellingPrice: 42000,  status: "in_stock",    location: "Shelf D-01", description: "15W E27 screw cap, 6500K, 1350lm, 25000h life, pack 10" },
    { name: "LED Floodlight 50W Outdoor IP66",        sku: "LT-FLD-50W-015",    categoryId: lighting.id,   supplierId: lightMaster.id, quantity: 35, reorderPoint: 8,  unitPrice: 55000,  sellingPrice: 85000,  status: "in_stock",    location: "Shelf D-02", description: "50W IP66 outdoor floodlight, 4500lm, cool white, 120° beam" },
    { name: "LED Strip Light 5m 12V RGB + Controller", sku: "LT-STP-RGB-016",   categoryId: lighting.id,   supplierId: lightMaster.id, quantity: 25, reorderPoint: 10, unitPrice: 22000,  sellingPrice: 35000,  status: "in_stock",    location: "Shelf D-03", description: "5m RGB LED strip, 12V DC, 60 LEDs/m, IR remote included" },
    // Safety Equipment
    { name: "Safety Helmet Class E (Yellow)",         sku: "SE-HLM-CE-017",     categoryId: safety.id,     supplierId: safeGuard.id,   quantity: 40, reorderPoint: 10, unitPrice: 22000,  sellingPrice: 35000,  status: "in_stock",    location: "Shelf E-01", description: "Class E electrical safety helmet, ANSI Z89.1, adjustable ratchet" },
    { name: "Electrical Insulation Gloves Class 0",   sku: "SE-GLV-INS-018",    categoryId: safety.id,     supplierId: safeGuard.id,   quantity: 60, reorderPoint: 15, unitPrice: 28000,  sellingPrice: 45000,  status: "in_stock",    location: "Shelf E-02", description: "1000V rated rubber gloves, Class 0, IEC 60903, medium" },
    { name: "Anti-fog Safety Goggles",                sku: "SE-GOG-AF-019",     categoryId: safety.id,     supplierId: safeGuard.id,   quantity: 3,  reorderPoint: 12, unitPrice: 8500,   sellingPrice: 14000,  status: "low_stock",   location: "Shelf E-03", description: "Impact-resistant polycarbonate lens, anti-fog coating, EN166" },
    // Measuring Instruments
    { name: "Fluke 117 True-RMS Multimeter",          sku: "MI-FLK-117-020",    categoryId: measuring.id,  supplierId: techMeasure.id, quantity: 20, reorderPoint: 5,  unitPrice: 195000, sellingPrice: 290000, status: "in_stock",    location: "Cabinet F-01", description: "True-RMS auto-ranging multimeter, VoltAlert, CAT III 600V" },
    { name: "Hioki CM4141 Clamp Meter 600A",          sku: "MI-HIK-CM4141-021", categoryId: measuring.id,  supplierId: techMeasure.id, quantity: 4,  reorderPoint: 4,  unitPrice: 185000, sellingPrice: 280000, status: "low_stock",   location: "Cabinet F-02", description: "AC/DC clamp meter, 600A, TRMS, data hold, CAT IV 300V" },
    { name: "Non-Contact Voltage Tester (200–1000V)", sku: "MI-NCV-1KV-022",    categoryId: measuring.id,  supplierId: techMeasure.id, quantity: 35, reorderPoint: 8,  unitPrice: 18000,  sellingPrice: 28000,  status: "in_stock",    location: "Cabinet F-03", description: "Non-contact AC voltage tester, 200–1000V, audible & visual alert" },
  ];

  const now = new Date();
  type SeededProduct = Awaited<ReturnType<typeof prisma.product.create>>;
  const products: SeededProduct[] = [];
  for (const p of productData) {
    // Stable in-store EAN-13 per product so the demo labels/scans are reproducible.
    const body = "200" + String(products.length + 1).padStart(9, "0");
    const product = await prisma.product.create({
      data: {
        ...p,
        barcode: body + ean13CheckDigit(body),
        lastRestocked: new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      },
    });
    products.push(product);
  }
  console.log(`Products: ${products.length}`);

  // Helper: find product index by SKU prefix
  const byIdx = (i: number) => products[i];

  // Transactions — spanning last 6 months
  const txData = [
    { idx: 0,  type: "purchase", qty: 50,  price: 95000,  total: 4750000,  ref: "PO-2026-001", notes: "Bosch drill stock-up",            daysAgo: 120 },
    { idx: 1,  type: "purchase", qty: 40,  price: 110000, total: 4400000,  ref: "PO-2026-002", notes: "Makita grinder order",            daysAgo: 110 },
    { idx: 9,  type: "purchase", qty: 100, price: 85000,  total: 8500000,  ref: "PO-2026-003", notes: "Cable bulk order",                daysAgo: 100 },
    { idx: 13, type: "purchase", qty: 200, price: 28000,  total: 5600000,  ref: "PO-2026-004", notes: "LED bulb restock",                daysAgo: 90 },
    { idx: 0,  type: "sale",     qty: 12,  price: 140000, total: 1680000,  ref: "SO-2026-001", notes: "",                               daysAgo: 85 },
    { idx: 1,  type: "sale",     qty: 10,  price: 165000, total: 1650000,  ref: "SO-2026-002", notes: "",                               daysAgo: 78 },
    { idx: 19, type: "purchase", qty: 25,  price: 195000, total: 4875000,  ref: "PO-2026-005", notes: "Fluke multimeter stock",         daysAgo: 70 },
    { idx: 5,  type: "purchase", qty: 80,  price: 25000,  total: 2000000,  ref: "PO-2026-006", notes: "Screwdriver sets bulk",          daysAgo: 60 },
    { idx: 10, type: "purchase", qty: 150, price: 18000,  total: 2700000,  ref: "PO-2026-007", notes: "Socket outlet restock",          daysAgo: 50 },
    { idx: 19, type: "sale",     qty: 5,   price: 290000, total: 1450000,  ref: "SO-2026-003", notes: "",                               daysAgo: 45 },
    { idx: 9,  type: "sale",     qty: 20,  price: 125000, total: 2500000,  ref: "SO-2026-004", notes: "",                               daysAgo: 38 },
    { idx: 16, type: "purchase", qty: 50,  price: 22000,  total: 1100000,  ref: "PO-2026-008", notes: "Safety helmet restock",          daysAgo: 30 },
    { idx: 17, type: "purchase", qty: 40,  price: 28000,  total: 1120000,  ref: "PO-2026-009", notes: "Insulation gloves order",        daysAgo: 25 },
    { idx: 1,  type: "sale",     qty: 8,   price: 165000, total: 1320000,  ref: "SO-2026-005", notes: "",                               daysAgo: 20 },
    { idx: 13, type: "sale",     qty: 30,  price: 42000,  total: 1260000,  ref: "SO-2026-006", notes: "",                               daysAgo: 15 },
    { idx: 11, type: "adjustment", qty: -5, price: 14000, total: -70000,   ref: "ADJ-2026-001", notes: "Stock count correction",        daysAgo: 10 },
    { idx: 9,  type: "purchase", qty: 50,  price: 85000,  total: 4250000,  ref: "PO-2026-010", notes: "Cable stock top-up",             daysAgo: 5 },
    { idx: 20, type: "sale",     qty: 2,   price: 280000, total: 560000,   ref: "SO-2026-007", notes: "",                               daysAgo: 3 },
  ];

  for (const t of txData) {
    await prisma.transaction.create({
      data: {
        productId: byIdx(t.idx).id,
        type: t.type,
        quantity: t.qty,
        unitPrice: t.price,
        totalAmount: t.total,
        reference: t.ref,
        notes: t.notes,
        createdAt: new Date(now.getTime() - t.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`Transactions: ${txData.length}`);

  console.log("\nSeed complete!");
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
