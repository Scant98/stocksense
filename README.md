# StockSense

Inventory, **barcode/QR point-of-sale**, suppliers and invoices for small shops.
Next.js 16 · Prisma 7 · Postgres · deploys to Vercel.

## What's in the MVP

- **Point of Sale (`/pos`)** – scan products like at a supermarket checkout:
  - USB / Bluetooth scanner guns (just scan; no setup)
  - Phone/tablet camera (barcodes and QR codes; works on iPhone, Android, desktop)
  - Cart, quantity/price edits, cash / mobile money / card, change calculation
  - Stock is deducted atomically at checkout (two tills can't oversell the last item)
  - Printable 80 mm receipts + receipt history
  - Unknown barcode? One tap opens "Add product" with the code pre-filled
- **Barcode labels (`/labels`)** – print EAN-13/Code 128 or QR labels for any product
  (every product gets a scannable in-store EAN-13 automatically)
- Inventory, categories, suppliers, orders, invoices, reports, alerts, users

Camera scanning needs HTTPS (Vercel provides it) or `localhost`.

## Local development

You need a Postgres database. Quickest: Docker.

```bash
docker run -d --name stocksense-pg -e POSTGRES_PASSWORD=stocksense -e POSTGRES_DB=stocksense -p 5439:5432 postgres:17
cp .env.example .env        # DATABASE_URL already points at the container above
npm install
npm run db:migrate          # create tables
npm run db:seed             # demo shop data (22 products with barcodes)
npm run dev
```

Seeded login: `danieldenho9@gmail.com` / `Admin123!`
(override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before seeding).

> `db:seed` wipes products, suppliers, categories, sales and invoices. Don't run it on a live shop's database.

## Deploy to Vercel

1. Create a free Postgres database (Vercel → Storage → Neon, or neon.tech / Supabase).
2. Push this repo to GitHub and import it in Vercel.
3. Set environment variables (Project → Settings → Environment Variables):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | pooled Postgres connection string |
   | `DIRECT_URL` | *(optional)* direct/unpooled string, used only for migrations |
   | `SESSION_SECRET` | long random string (`openssl rand -base64 32`) – **required** |
   | `NEXT_PUBLIC_SHOP_NAME` | *(optional)* name printed on receipts |
   | `SHOP_TIMEZONE` | *(optional)* default `Africa/Dar_es_Salaam` |

4. Deploy. The `vercel-build` script generates the Prisma client, applies migrations, and builds.
5. Seed demo data once from your machine, pointing at the production DB:

   ```bash
   DATABASE_URL="postgresql://…" SEED_ADMIN_EMAIL="you@example.com" SEED_ADMIN_PASSWORD="choose-one" npm run db:seed
   ```

## Scanner tips

- Scanner guns that act as a keyboard work on the POS page with no configuration. Set the gun to add an **Enter** suffix (most do by default).
- Print labels from **Barcode Labels**, or from the label icon on a product row.
- Products that already carry a manufacturer barcode: edit the product and scan it into the Barcode field.

## Scripts

`dev` · `build` · `start` · `typecheck` · `lint` · `db:migrate` · `db:seed` · `db:studio`
