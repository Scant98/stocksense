/** Helpers for product codes (EAN-13 / UPC-A barcodes, QR payloads, SKUs). */

/** Strip whitespace and control characters that scanners sometimes add. */
export function normalizeCode(raw: string): string {
  return raw.replace(/[\u0000-\u001f\u007f]/g, "").trim();
}

export function ean13CheckDigit(first12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidEan13(code: string): boolean {
  return /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === Number(code[12]);
}

/**
 * Generate an in-store EAN-13. The 200–299 prefix range is reserved by GS1 for
 * internal use, so these never collide with manufacturer barcodes.
 */
export function generateEan13(random: () => number = Math.random): string {
  let body = "200";
  for (let i = 0; i < 9; i++) body += Math.floor(random() * 10);
  return body + ean13CheckDigit(body);
}

/**
 * Scanners disagree on leading zeros (UPC-A 12 digits vs EAN-13 with a 0
 * prefix), so a lookup should try every equivalent spelling of the code.
 */
export function codeVariants(raw: string): string[] {
  const code = normalizeCode(raw);
  if (!code) return [];
  const variants = new Set([code]);
  if (/^\d{12}$/.test(code)) variants.add("0" + code);
  if (/^0\d{12}$/.test(code)) variants.add(code.slice(1));
  return [...variants];
}
