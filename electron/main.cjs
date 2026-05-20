/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const http = require("http");
const Database = require("better-sqlite3");
const { spawn } = require("child_process");

const isDev = !app.isPackaged;
const PORT = Number(process.env.PORT || 3000);
const HOST = "127.0.0.1";
const APP_URL = `http://${HOST}:${PORT}`;
const LOG_PATH = path.join(process.env.TEMP || process.cwd(), "stocksense-electron.log");

let mainWindow = null;
let nextProcess = null;
let startupError = null;

function log(message, error) {
  const detail = error
    ? ` ${error instanceof Error ? `${error.stack || error.message}` : String(error)}`
    : "";
  const line = `[${new Date().toISOString()}] ${message}${detail}\n`;

  try {
    fs.appendFileSync(LOG_PATH, line, "utf8");
  } catch {}
}

process.on("uncaughtException", (error) => {
  log("uncaughtException", error);
});

process.on("unhandledRejection", (error) => {
  log("unhandledRejection", error);
});

function ensureRuntimeSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;

  const secretsDir = path.join(app.getPath("userData"), "config");
  const secretPath = path.join(secretsDir, "session-secret.txt");
  fs.mkdirSync(secretsDir, { recursive: true });

  if (!fs.existsSync(secretPath)) {
    fs.writeFileSync(secretPath, crypto.randomBytes(32).toString("hex"), "utf8");
  }

  const secret = fs.readFileSync(secretPath, "utf8").trim();
  process.env.SESSION_SECRET = secret;
  return secret;
}

function ensureRuntimeDatabase() {
  const dataDir = path.join(app.getPath("userData"), "data");
  const databasePath = path.join(dataDir, "stocksense.db");
  const bundledSeedPath = path.join(process.resourcesPath, "bootstrap", "dev.db");
  const localSeedPath = path.join(process.cwd(), "prisma", "dev.db");

  fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(databasePath)) {
    const seedPath = fs.existsSync(bundledSeedPath) ? bundledSeedPath : localSeedPath;
    if (fs.existsSync(seedPath)) {
      fs.copyFileSync(seedPath, databasePath);
    } else {
      fs.closeSync(fs.openSync(databasePath, "w"));
    }
  }

  process.env.LIBSQL_EMBEDDED_URL = `file:${databasePath}`;
  return databasePath;
}

function tableExists(db, tableName) {
  return Boolean(
    db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName)
  );
}

function getTableColumn(db, tableName, columnName) {
  return db
    .prepare(`PRAGMA table_info("${tableName}")`)
    .all()
    .find((column) => column.name === columnName);
}

function getForeignKey(db, tableName, columnName) {
  return db
    .prepare(`PRAGMA foreign_key_list("${tableName}")`)
    .all()
    .find((fk) => fk.from === columnName);
}

function getMigrationDefinitions() {
  return [
    {
      name: "20260425232552_init",
      file: path.join("20260425232552_init", "migration.sql"),
      isApplied(db) {
        return ["User", "Category", "Supplier", "Product", "Transaction"].every((table) =>
          tableExists(db, table)
        );
      },
    },
    {
      name: "20260427000000_add_invoices",
      file: path.join("20260427000000_add_invoices", "migration.sql"),
      isApplied(db) {
        return ["Invoice", "InvoiceItem"].every((table) => tableExists(db, table));
      },
    },
    {
      name: "20260429030528_add_cascade_delete",
      file: path.join("20260429030528_add_cascade_delete", "migration.sql"),
      isApplied(db) {
        const supplierColumn = getTableColumn(db, "Product", "supplierId");
        const productSupplierKey = getForeignKey(db, "Product", "supplierId");
        const transactionProductKey = getForeignKey(db, "Transaction", "productId");

        return (
          Boolean(supplierColumn) &&
          supplierColumn.notnull === 0 &&
          String(productSupplierKey?.on_delete || "").toUpperCase() === "SET NULL" &&
          String(transactionProductKey?.on_delete || "").toUpperCase() === "CASCADE"
        );
      },
    },
    {
      name: "20260429074500_add_invoice_sequence",
      file: path.join("20260429074500_add_invoice_sequence", "migration.sql"),
      isApplied(db) {
        return tableExists(db, "InvoiceSequence");
      },
    },
  ];
}

function getMigrationRoot() {
  const bundledPath = path.join(process.resourcesPath, "bootstrap", "migrations");
  const localPath = path.join(process.cwd(), "prisma", "migrations");
  return fs.existsSync(bundledPath) ? bundledPath : localPath;
}

function ensureRuntimeMigrations(databasePath) {
  const migrationRoot = getMigrationRoot();

  if (!fs.existsSync(migrationRoot)) {
    log(`migrations:skip missing root ${migrationRoot}`);
    return;
  }

  const db = new Database(databasePath);

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS "_stocksense_migrations" (
        "name" TEXT NOT NULL PRIMARY KEY,
        "appliedAt" TEXT NOT NULL
      )
    `);

    const markApplied = db.prepare(
      'INSERT OR IGNORE INTO "_stocksense_migrations" ("name", "appliedAt") VALUES (?, ?)'
    );

    for (const migration of getMigrationDefinitions()) {
      const alreadyRecorded = db
        .prepare('SELECT 1 FROM "_stocksense_migrations" WHERE "name" = ?')
        .get(migration.name);

      if (alreadyRecorded) {
        continue;
      }

      if (migration.isApplied(db)) {
        markApplied.run(migration.name, new Date().toISOString());
        log(`migrations:baseline ${migration.name}`);
        continue;
      }

      const migrationPath = path.join(migrationRoot, migration.file);
      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Missing migration file: ${migrationPath}`);
      }

      log(`migrations:apply ${migration.name}`);
      db.exec(fs.readFileSync(migrationPath, "utf8"));
      markApplied.run(migration.name, new Date().toISOString());
    }
  } finally {
    db.close();
  }
}

function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, () => resolve()).on("error", () => {
        if (Date.now() - start > timeoutMs) return reject(new Error("Next server timeout"));
        setTimeout(tick, 400);
      });
      req.setTimeout(2000, () => req.destroy());
    };
    tick();
  });
}

async function startNextServer() {
  log("startNextServer:begin");
  ensureRuntimeSessionSecret();
  const databasePath = ensureRuntimeDatabase();
  ensureRuntimeMigrations(databasePath);

  const appDir = isDev ? process.cwd() : app.getAppPath();
  const nextBin = path.join(appDir, "node_modules", "next", "dist", "bin", "next");
  const args = [nextBin, isDev ? "dev" : "start", appDir, "-p", String(PORT), "-H", HOST];
  const cwd = isDev ? appDir : process.resourcesPath;
  const nodePathEntries = [
    path.join(process.resourcesPath, "node_modules"),
    path.join(appDir, "node_modules"),
    path.join(appDir, "node_modules", "@prisma", "client", "node_modules"),
    process.env.NODE_PATH,
  ].filter(Boolean);
  const nodePath = nodePathEntries.join(path.delimiter);

  log(`startNextServer:spawn ${process.execPath} ${args.join(" ")}`);

  await new Promise((resolve, reject) => {
    nextProcess = spawn(process.execPath, args, {
      cwd,
      env: {
        ...process.env,
        PORT: String(PORT),
        HOSTNAME: HOST,
        NODE_ENV: isDev ? "development" : "production",
        SESSION_SECRET: process.env.SESSION_SECRET,
        LIBSQL_EMBEDDED_URL: process.env.LIBSQL_EMBEDDED_URL,
        NODE_PATH: nodePath,
        ELECTRON_RUN_AS_NODE: "1",
      },
      stdio: "pipe",
      windowsHide: true,
    });

    nextProcess.stdout.on("data", (chunk) => {
      log(`next:stdout ${chunk.toString().trim()}`);
    });

    nextProcess.stderr.on("data", (chunk) => {
      log(`next:stderr ${chunk.toString().trim()}`);
    });

    nextProcess.once("error", reject);
    nextProcess.once("exit", (code, signal) => {
      log(`next:exit code=${code} signal=${signal}`);
    });

    waitForServer(APP_URL, 120000)
      .then(() => {
        log(`startNextServer:listening ${APP_URL}`);
        resolve();
      })
      .catch(reject);
  });
}

async function stopNextServer() {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
}

async function createWindow() {
  log("createWindow:begin");
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0A0F1E",
    title: "StockSense",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  try {
    if (startupError) throw startupError;
    await waitForServer(APP_URL);
    log(`createWindow:loading ${APP_URL}`);
    await mainWindow.loadURL(APP_URL);
  } catch (e) {
    log("createWindow:error", e);
    console.error("Failed to load app:", e);
    mainWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          `<html><body style="font-family:sans-serif;background:#0A0F1E;color:#fff;padding:40px">
          <h1>StockSense failed to start</h1><pre>${String(e)}</pre></body></html>`
        )
    );
  }
}

app.whenReady().then(async () => {
  log("app.whenReady");
  try {
    await startNextServer();
  } catch (error) {
    startupError = error;
    log("startNextServer:error", error);
    console.error("Failed to start embedded Next server:", error);
  }

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  log("window-all-closed");
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", async (event) => {
  log("before-quit");
  if (nextProcess) {
    event.preventDefault();
    await stopNextServer();
    app.exit();
  }
});
