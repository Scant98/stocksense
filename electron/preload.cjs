/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("stocksense", {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
});
