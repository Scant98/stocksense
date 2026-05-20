# StockSense

StockSense is a Next.js + Electron inventory application backed by a local SQLite database.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Bootstrap the app:

```bash
npm run setup
```

3. Start development:

```bash
npm run dev
```

The setup script copies `.env.example` to `.env.local` when needed, generates the Prisma client, applies migrations, and seeds the database.

## Desktop App

Build an installer with:

```bash
npm run electron:build
```

The generated installer is written to `dist-electron/`. On first launch, the packaged app copies the bundled seed database into the current user's application data directory and runs against that writable copy, so it can be installed on another computer without manual database setup.

## Environment

Use `.env.local` for local development:

```env
LIBSQL_EMBEDDED_URL="file:prisma/dev.db"
SESSION_SECRET="replace-this-with-a-long-random-secret"
```

## Useful Commands

- `npm run setup` initializes a fresh machine.
- `npm run db:seed` reseeds the database.
- `npm run backup` exports the current database to `backups/`.
- `npm run restore -- backups/<file>.json` restores a backup.
- `npm run electron:build` creates an installer.
