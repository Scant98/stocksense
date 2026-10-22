let audioCtx: AudioContext | null = null;

function tone(freq: number, startOffset: number, duration: number, volume = 0.15) {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx ??= new Ctx();
    const ctx = audioCtx;
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(ctx.destination);
    const t0 = ctx.currentTime + startOffset;
    osc.start(t0);
    osc.stop(t0 + duration);
  } catch {
    // Audio is a nicety; never let it break a sale.
  }
}

/** Supermarket-style feedback: a short high beep for a good scan, a low double buzz for a bad one. */
export function scanFeedback(kind: "ok" | "error") {
  if (kind === "ok") {
    tone(1800, 0, 0.09);
    navigator.vibrate?.(30);
  } else {
    tone(220, 0, 0.14);
    tone(180, 0.18, 0.2);
    navigator.vibrate?.([60, 40, 60]);
  }
}
