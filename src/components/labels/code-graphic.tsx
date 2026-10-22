"use client";

import { useEffect, useRef, useState } from "react";
import { isValidEan13 } from "@/lib/barcode";

interface CodeGraphicProps {
  value: string;
  kind: "barcode" | "qr";
  className?: string;
}

/** Renders a scannable barcode (EAN-13 when valid, otherwise Code 128) or a QR code as inline SVG. */
export function CodeGraphic({ value, kind, className }: CodeGraphicProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [qrSvg, setQrSvg] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (kind === "barcode") {
      import("jsbarcode").then(({ default: JsBarcode }) => {
        const svg = svgRef.current;
        if (cancelled || !svg) return;
        try {
          JsBarcode(svg, value, {
            format: isValidEan13(value) ? "EAN13" : "CODE128",
            displayValue: false,
            margin: 0,
            height: 60,
            width: 2,
          });
          // Make the SVG scale to its container instead of using fixed pixel sizes.
          const w = svg.getAttribute("width");
          const h = svg.getAttribute("height");
          if (w && h) svg.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
          svg.removeAttribute("width");
          svg.removeAttribute("height");
          svg.setAttribute("preserveAspectRatio", "none");
        } catch {
          svg.innerHTML = "";
        }
      });
    } else {
      import("qrcode").then((QR) => {
        QR.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M" }).then((svg) => {
          if (!cancelled) setQrSvg(svg);
        });
      });
    }

    return () => {
      cancelled = true;
    };
  }, [value, kind]);

  if (kind === "qr") {
    return (
      <div
        className={className}
        // Generated locally by the `qrcode` library from the product code; no user markup is involved.
        dangerouslySetInnerHTML={{ __html: qrSvg }}
        aria-label={`QR code for ${value}`}
        role="img"
      />
    );
  }

  return (
    <div className={className}>
      <svg ref={svgRef} className="h-full w-full" role="img" aria-label={`Barcode for ${value}`} />
    </div>
  );
}
