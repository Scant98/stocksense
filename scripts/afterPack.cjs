/**
 * electron-builder afterPack hook.
 * Disables the ASAR integrity fuse so the app starts correctly on all machines.
 * Electron 33 enables this fuse by default, but it causes exit-code-1 crashes
 * when the computed hash doesn't match (common with certain build environments).
 */
const { flipFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");
const path = require("path");
const fs = require("fs");

module.exports = async function afterPack({ appOutDir, packager }) {
  const platform = packager.platform.nodeName; // "win32", "darwin", "linux"
  const productName = packager.appInfo.productName;
  const ext = platform === "win32" ? ".exe" : "";
  const executablePath = path.join(appOutDir, `${productName}${ext}`);

  if (!fs.existsSync(executablePath)) {
    console.warn(`afterPack: executable not found at ${executablePath}`);
    return;
  }

  console.log(`afterPack: flipping fuses on ${executablePath}`);

  await flipFuses(executablePath, {
    version: FuseVersion.V1,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
    [FuseV1Options.OnlyLoadAppFromAsar]: false,
  });

  console.log("afterPack: fuses flipped successfully");
};
