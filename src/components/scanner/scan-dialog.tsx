"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CameraScanner } from "@/components/scanner/camera-scanner";
import { scanFeedback } from "@/lib/scan-feedback";

interface ScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
  title?: string;
}

/** One-shot camera scan: closes itself as soon as a code is read. */
export function ScanDialog({ open, onOpenChange, onScan, title = "Scan a barcode or QR code" }: ScanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Point the camera at the code. It is read automatically.</DialogDescription>
        </DialogHeader>
        {open && (
          <CameraScanner
            onScan={(code) => {
              scanFeedback("ok");
              onOpenChange(false);
              onScan(code);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
