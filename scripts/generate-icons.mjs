import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const buildDir = path.join(root, "build");
const electronDir = path.join(root, "electron");
const svgPath = path.join(buildDir, "icon.svg");
const pngPath = path.join(buildDir, "icon.png");
const icoPath = path.join(buildDir, "icon.ico");
const electronPngPath = path.join(electronDir, "icon.png");

const iconSvg = String.raw`<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="140" y1="120" x2="900" y2="920" gradientUnits="userSpaceOnUse">
      <stop stop-color="#07111F"/>
      <stop offset="0.55" stop-color="#0E2238"/>
      <stop offset="1" stop-color="#12385A"/>
    </linearGradient>
    <linearGradient id="accent" x1="250" y1="210" x2="760" y2="800" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6EE7F9"/>
      <stop offset="0.45" stop-color="#4F8CFF"/>
      <stop offset="1" stop-color="#2C5CFF"/>
    </linearGradient>
    <linearGradient id="chart" x1="356" y1="330" x2="670" y2="726" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E6F6FF"/>
      <stop offset="1" stop-color="#9AD7FF"/>
    </linearGradient>
  </defs>
  <rect x="72" y="72" width="880" height="880" rx="224" fill="url(#bg)"/>
  <rect x="112" y="112" width="800" height="800" rx="188" stroke="rgba(255,255,255,0.08)" stroke-width="12"/>
  <rect x="240" y="244" width="544" height="536" rx="120" fill="url(#accent)"/>
  <rect x="312" y="316" width="400" height="392" rx="84" fill="#081523" fill-opacity="0.9"/>
  <rect x="370" y="490" width="58" height="146" rx="24" fill="url(#chart)"/>
  <rect x="483" y="420" width="58" height="216" rx="24" fill="url(#chart)"/>
  <rect x="596" y="348" width="58" height="288" rx="24" fill="url(#chart)"/>
  <path d="M328 420C372 383 421 356 476 340C529 324 586 322 647 334" stroke="#7CE7F7" stroke-width="34" stroke-linecap="round"/>
  <circle cx="654" cy="334" r="26" fill="#7CE7F7"/>
  <path d="M282 760L742 760" stroke="rgba(255,255,255,0.14)" stroke-width="28" stroke-linecap="round"/>
</svg>`;

function pngToIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0);
  entry.writeUInt8(0, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

async function main() {
  fs.mkdirSync(buildDir, { recursive: true });
  fs.writeFileSync(svgPath, iconSvg, "utf8");

  const pngBuffer = await sharp(Buffer.from(iconSvg))
    .png()
    .resize(1024, 1024)
    .toBuffer();

  fs.writeFileSync(pngPath, pngBuffer);
  fs.writeFileSync(icoPath, pngToIco(pngBuffer));
  fs.writeFileSync(electronPngPath, pngBuffer);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
