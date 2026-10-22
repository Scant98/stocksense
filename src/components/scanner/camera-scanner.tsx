"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, Flashlight, FlashlightOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CameraScannerProps {
  /** Called once per code. The same code is not reported again until it has left the frame. */
  onScan: (code: string) => void;
  /** How long a code must be out of sight before scanning it again counts as a new item. */
  rescanGapMs?: number;
  className?: string;
}

// Minimal typing for the (still non-standard) Shape Detection API.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code", "data_matrix"];

type Status = "starting" | "scanning" | "error";

function describeCameraError(error: unknown) {
  if (!window.isSecureContext) return "Camera access needs HTTPS. Open the deployed (https) site, or use localhost.";
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera permission was denied. Allow camera access in your browser settings and try again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found on this device.";
  if (name === "NotReadableError") return "The camera is in use by another app.";
  return "Could not start the camera.";
}

export function CameraScanner({ onScan, rescanGapMs = 1000, className }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const [status, setStatus] = useState<Status>("starting");
  const [message, setMessage] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let stopLoop: (() => void) | null = null;
    let lastCode = "";
    let lastSeen = 0;

    // Holding one item in front of the camera must count once, like a till scanner:
    // only report again after the code has been out of view for `rescanGapMs`.
    const emit = (code: string) => {
      const now = Date.now();
      const isRepeat = code === lastCode && now - lastSeen < rescanGapMs;
      lastCode = code;
      lastSeen = now;
      if (!isRepeat) onScanRef.current(code);
    };

    async function start() {
      const video = videoRef.current;
      if (!video) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setMessage(describeCameraError(null));
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(describeCameraError(error));
        }
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const track = stream.getVideoTracks()[0];
      trackRef.current = track;
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
      setTorchSupported(!!caps.torch);

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      try {
        await video.play();
      } catch {
        // autoplay can reject if the element was removed mid-start
      }
      if (cancelled) return;
      setStatus("scanning");

      const Native = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
      let detector: BarcodeDetectorLike | null = null;
      if (Native) {
        try {
          const supported = (await Native.getSupportedFormats?.()) ?? FORMATS;
          const formats = FORMATS.filter((f) => supported.includes(f));
          if (formats.length) detector = new Native({ formats });
        } catch {
          detector = null;
        }
      }

      if (detector) {
        // Chrome/Android/Edge: hardware-accelerated native detector.
        const native = detector;
        let busy = false;
        const timer = window.setInterval(async () => {
          if (busy || video.readyState < 2) return;
          busy = true;
          try {
            const codes = await native.detect(video);
            if (codes[0]?.rawValue) emit(codes[0].rawValue);
          } catch {
            // transient decode failure; try the next frame
          } finally {
            busy = false;
          }
        }, 120);
        stopLoop = () => window.clearInterval(timer);
        return;
      }

      // Safari / Firefox: pure-JS ZXing fallback, loaded only when needed.
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);
      if (cancelled) return;
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.ITF,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
      ]);
      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 300,
      });
      const controls = await reader.decodeFromStream(stream, video, (result) => {
        if (result) emit(result.getText());
      });
      if (cancelled) {
        controls.stop();
        return;
      }
      stopLoop = () => controls.stop();
    }

    start().catch((error) => {
      if (!cancelled) {
        setStatus("error");
        setMessage(describeCameraError(error));
      }
    });

    return () => {
      cancelled = true;
      stopLoop?.();
      stream?.getTracks().forEach((t) => t.stop());
      trackRef.current = null;
    };
  }, [rescanGapMs]);

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((v) => !v);
    } catch {
      setTorchSupported(false);
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-black", className)}>
      <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full object-cover sm:aspect-video" />

      {status === "scanning" && (
        <>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-1/2 w-4/5 rounded-xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-red-500/80" />
            </div>
          </div>
          {torchSupported && (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={toggleTorch}
              className="absolute right-3 top-3 size-9 rounded-full"
              aria-label={torchOn ? "Turn flashlight off" : "Turn flashlight on"}
            >
              {torchOn ? <FlashlightOff className="size-4" /> : <Flashlight className="size-4" />}
            </Button>
          )}
        </>
      )}

      {status === "starting" && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white/80">
          <Loader2 className="size-4 animate-spin" /> Starting camera…
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center text-sm text-white">
          <CameraOff className="size-6 text-white/70" />
          <p className="max-w-xs">{message}</p>
        </div>
      )}
    </div>
  );
}
