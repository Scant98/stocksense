import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSyncState, syncNow, startSyncDaemon } from "@/lib/sync-daemon";

export async function POST() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  startSyncDaemon();
  try {
    const state = await syncNow();
    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const currentState = getSyncState();
    return NextResponse.json(
      { success: false, error: "Sync failed", detail, ...currentState },
      { status: currentState.mode === "disabled" ? 400 : 500 }
    );
  }
}

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  startSyncDaemon();
  return NextResponse.json(getSyncState());
}
