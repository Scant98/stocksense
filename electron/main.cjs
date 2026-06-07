/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const net = require("net");
const crypto = require("crypto");
const http = require("http");
const Database = require("better-sqlite3");
const { spawn } = require("child_process");

// Fix blank-window on machines with bad GPU drivers
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-software-rasterizer");

const isDev = !app.isPackaged;
const HOST = "127.0.0.1";
const LOG_PATH = path.join(process.env.TEMP || process.cwd(), "stocksense-electron.log");

let mainWindow = null;
let nextProcess = null;
let resolvedPort = null;

function log(message, error) {
  const detail = error
    ? ` ${error instanceof Error ? `${error.stack || error.message}` : String(error)}`
    : "";
  const line = `[${new Date().toISOString()}] ${message}${detail}\n`;
  try { fs.appendFileSync(LOG_PATH, line, "utf8"); } catch {}
}

process.on("uncaughtException", (error) => log("uncaughtException", error));
process.on("unhandledRejection", (error) => log("unhandledRejection", error));

// Find a free TCP port — avoids conflicts with IIS, other apps, etc.
function findFreePort(preferred) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      // preferred port taken — let OS pick one
      const fallback = net.createServer();
      fallback.listen(0, HOST, () => {
        const port = fallback.address().port;
        fallback.close(() => resolve(port));
      });
    });
    server.listen(preferred, HOST, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

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
    db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName)
  );
}

function getTableColumn(db, tableName, columnName) {
  return db.prepare(`PRAGMA table_info("${tableName}")`).all().find((c) => c.name === columnName);
}

function getForeignKey(db, tableName, columnName) {
  return db.prepare(`PRAGMA foreign_key_list("${tableName}")`).all().find((fk) => fk.from === columnName);
}

function getMigrationDefinitions() {
  return [
    {
      name: "20260425232552_init",
      file: path.join("20260425232552_init", "migration.sql"),
      isApplied(db) {
        return ["User", "Category", "Supplier", "Product", "Transaction"].every((t) => tableExists(db, t));
      },
    },
    {
      name: "20260427000000_add_invoices",
      file: path.join("20260427000000_add_invoices", "migration.sql"),
      isApplied(db) {
        return ["Invoice", "InvoiceItem"].every((t) => tableExists(db, t));
      },
    },
    {
      name: "20260429030528_add_cascade_delete",
      file: path.join("20260429030528_add_cascade_delete", "migration.sql"),
      isApplied(db) {
        const col = getTableColumn(db, "Product", "supplierId");
        const prodFk = getForeignKey(db, "Product", "supplierId");
        const txFk = getForeignKey(db, "Transaction", "productId");
        return (
          Boolean(col) &&
          col.notnull === 0 &&
          String(prodFk?.on_delete || "").toUpperCase() === "SET NULL" &&
          String(txFk?.on_delete || "").toUpperCase() === "CASCADE"
        );
      },
    },
    {
      name: "20260429074500_add_invoice_sequence",
      file: path.join("20260429074500_add_invoice_sequence", "migration.sql"),
      isApplied(db) { return tableExists(db, "InvoiceSequence"); },
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
  if (!fs.existsSync(migrationRoot)) { log(`migrations:skip missing root ${migrationRoot}`); return; }

  const db = new Database(databasePath);
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS "_stocksense_migrations" ("name" TEXT NOT NULL PRIMARY KEY, "appliedAt" TEXT NOT NULL)`);
    const markApplied = db.prepare('INSERT OR IGNORE INTO "_stocksense_migrations" ("name", "appliedAt") VALUES (?, ?)');

    for (const migration of getMigrationDefinitions()) {
      const recorded = db.prepare('SELECT 1 FROM "_stocksense_migrations" WHERE "name" = ?').get(migration.name);
      if (recorded) continue;
      if (migration.isApplied(db)) { markApplied.run(migration.name, new Date().toISOString()); log(`migrations:baseline ${migration.name}`); continue; }
      const migrationPath = path.join(migrationRoot, migration.file);
      if (!fs.existsSync(migrationPath)) throw new Error(`Missing migration file: ${migrationPath}`);
      log(`migrations:apply ${migration.name}`);
      db.exec(fs.readFileSync(migrationPath, "utf8"));
      markApplied.run(migration.name, new Date().toISOString());
    }
  } finally { db.close(); }
}

function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, () => resolve()).on("error", () => {
        if (Date.now() - start > timeoutMs) return reject(new Error(`Server did not start within ${timeoutMs / 1000}s`));
        setTimeout(tick, 500);
      });
      req.setTimeout(2000, () => req.destroy());
    };
    tick();
  });
}

// Show window immediately with a loading page so user sees something right away
function createLoadingWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0A0F1E",
    title: "StockSense",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Show a loading page immediately
  mainWindow.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0A0F1E;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 20px;
    }
    .logo {
      width: 64px; height: 64px;
      background: #6366F1;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px;
      box-shadow: 0 0 40px rgba(99,102,241,0.5);
    }
    h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    p { color: #6B7280; font-size: 14px; }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid rgba(99,102,241,0.2);
      border-top-color: #6366F1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="logo">📦</div>
  <h1>StockSense</h1>
  <div class="spinner"></div>
  <p>Starting up, please wait…</p>
</body>
</html>`)
  );

  return mainWindow;
}

async function startNextServer() {
  log("startNextServer:begin");
  ensureRuntimeSessionSecret();
  const databasePath = ensureRuntimeDatabase();
  ensureRuntimeMigrations(databasePath);

  resolvedPort = await findFreePort(3000);
  const appUrl = `http://${HOST}:${resolvedPort}`;
  log(`startNextServer:port ${resolvedPort}`);

  const appDir = isDev ? process.cwd() : app.getAppPath();
  const nextBin = path.join(appDir, "node_modules", "next", "dist", "bin", "next");
  const args = [nextBin, isDev ? "dev" : "start", appDir, "-p", String(resolvedPort), "-H", HOST];
  const cwd = isDev ? appDir : process.resourcesPath;
  const nodePathEntries = [
    path.join(process.resourcesPath, "node_modules"),
    path.join(appDir, "node_modules"),
    path.join(appDir, "node_modules", "@prisma", "client", "node_modules"),
    process.env.NODE_PATH,
  ].filter(Boolean);

  log(`startNextServer:spawn ${process.execPath} ${args.join(" ")}`);

  nextProcess = spawn(process.execPath, args, {
    cwd,
    env: {
      ...process.env,
      PORT: String(resolvedPort),
      HOSTNAME: HOST,
      NODE_ENV: isDev ? "development" : "production",
      SESSION_SECRET: process.env.SESSION_SECRET,
      LIBSQL_EMBEDDED_URL: process.env.LIBSQL_EMBEDDED_URL,
      NODE_PATH: nodePathEntries.join(path.delimiter),
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: "pipe",
    windowsHide: true,
  });

  nextProcess.stdout.on("data", (chunk) => log(`next:stdout ${chunk.toString().trim()}`));
  nextProcess.stderr.on("data", (chunk) => log(`next:stderr ${chunk.toString().trim()}`));
  nextProcess.once("error", (err) => log("next:spawn-error", err));
  nextProcess.once("exit", (code, signal) => log(`next:exit code=${code} signal=${signal}`));

  await waitForServer(appUrl, 90000);
  log(`startNextServer:ready ${appUrl}`);
  return appUrl;
}

async function stopNextServer() {
  if (nextProcess) { nextProcess.kill(); nextProcess = null; }
}

app.whenReady().then(async () => {
  log("app.whenReady");

  // Show the loading window immediately — user sees something right away
  createLoadingWindow();

  try {
    const appUrl = await startNextServer();
    log(`navigating to ${appUrl}`);
    await mainWindow.loadURL(appUrl);
    log("app:loaded");
  } catch (error) {
    log("startup:error", error);
    mainWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { background:#0A0F1E; color:#fff; font-family:sans-serif; padding:48px; }
    h1 { color:#F43F5E; margin-bottom:16px; }
    pre { background:#1a1a2e; padding:16px; border-radius:8px; font-size:13px; color:#F59E0B; white-space:pre-wrap; word-break:break-all; }
    p { color:#9CA3AF; margin-bottom:12px; }
    .log { color:#6B7280; font-size:12px; margin-top:20px; }
  </style>
</head>
<body>
  <h1>StockSense failed to start</h1>
  <p>The app encountered an error during startup. Please try the following:</p>
  <p>1. Close this window and reopen StockSense<br>2. Restart your computer and try again<br>3. Check if another app is using port 3000</p>
  <pre>${String(error)}</pre>
  <p class="log">Full log: %TEMP%\\stocksense-electron.log</p>
</body>
</html>`)
    );
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createLoadingWindow();
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
