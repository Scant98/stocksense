interface SyncState {
  enabled: boolean;
  mode: "local-only" | "disabled";
  lastSync: string | null;
  lastError: string | null;
  message: string | null;
  intervalMs: number;
  syncCount: number;
}

const state: SyncState = {
  enabled: false,
  mode: "local-only",
  lastSync: null,
  lastError: null,
  message: "This build uses only the local SQLite database. Cloud sync is disabled.",
  intervalMs: 30_000,
  syncCount: 0,
};

export function startSyncDaemon() {
  state.mode = "local-only";
  state.enabled = false;
  state.lastError = null;
  state.message = "This build uses only the local SQLite database. Cloud sync is disabled.";
  return state;
}

export function getSyncState(): SyncState {
  return { ...state };
}

export async function syncNow(): Promise<SyncState> {
  state.mode = "local-only";
  state.enabled = false;
  state.lastSync = new Date().toISOString();
  state.lastError = null;
  state.message = "Local SQLite mode is active. There is nothing to sync.";
  return getSyncState();
}
