"use client";

import { useEffect, useRef } from "react";

/**
 * USB / Bluetooth barcode guns act as a keyboard: they "type" the code very
 * quickly and finish with Enter. This listens globally (when no field is
 * focused) and reports a code once a fast burst of keys ends with Enter.
 */
export function useHardwareScanner(onScan: (code: string) => void, enabled = true) {
  const handler = useRef(onScan);
  useEffect(() => {
    handler.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;
    let buffer = "";
    let lastKey = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const editable =
        el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (editable || e.ctrlKey || e.metaKey || e.altKey) return;

      const now = performance.now();
      if (now - lastKey > 80) buffer = ""; // too slow to be a scanner: start over
      lastKey = now;

      if (e.key === "Enter") {
        if (buffer.length >= 4) {
          e.preventDefault();
          handler.current(buffer);
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
