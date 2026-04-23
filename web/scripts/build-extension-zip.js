#!/usr/bin/env node
/**
 * Build the LLReporter Chrome extension into a ZIP that the dashboard
 * serves at /llreporter-extension.zip.
 *
 * Steps:
 *  1. (Re)generate icon PNGs into extension/src/icon{16,48,128}.png
 *  2. Zip the entire extension/src folder (flat, so users can "Load unpacked")
 *  3. Drop the zip at web/public/llreporter-extension.zip
 *
 * Run via: `node web/scripts/build-extension-zip.js`
 * Or as part of `npm run build` (wired into web/package.json prebuild).
 */
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const EXT_SRC = path.join(ROOT, "extension", "src");
const OUT_DIR = path.join(ROOT, "web", "public");
const OUT_ZIP = path.join(OUT_DIR, "llreporter-extension.zip");

function log(...a) {
  console.log("[ext-zip]", ...a);
}

// --------------------------------------------------------------
// 1. Generate solid-color icon PNGs (no native deps).
//    We hand-roll a tiny PNG encoder using only Node's built-in zlib.
//    Result: clean blue square at the requested size — Chrome scales
//    it cleanly in the toolbar.
// --------------------------------------------------------------
const zlib = require("node:zlib");

function crc32(buf) {
  let c;
  const table = crc32._t || (crc32._t = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** Encode a solid-color RGBA PNG of the given size. */
function solidPng(size, [r, g, b, a]) {
  // Pixel data: each row prefixed with filter byte 0.
  const row = Buffer.alloc(1 + size * 4);
  row[0] = 0;
  for (let x = 0; x < size; x++) {
    const o = 1 + x * 4;
    row[o] = r; row[o + 1] = g; row[o + 2] = b; row[o + 3] = a;
  }
  const raw = Buffer.concat(Array(size).fill(row));
  const idat = zlib.deflateSync(raw);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function generateIcons() {
  // LLReporter accent blue (#2f7dff) as RGBA.
  const blue = [0x2f, 0x7d, 0xff, 0xff];
  for (const size of [16, 48, 128]) {
    fs.writeFileSync(path.join(EXT_SRC, `icon${size}.png`), solidPng(size, blue));
    log(`wrote icon${size}.png (${size}x${size})`);
  }
}

// --------------------------------------------------------------
// 2. Zip the extension/src folder.
// --------------------------------------------------------------
function zipExtension() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (fs.existsSync(OUT_ZIP)) fs.unlinkSync(OUT_ZIP);

  // Use the system `zip` CLI — present on Alpine via `apk add zip`,
  // on macOS by default, on Nixpacks via the nix `zip` package.
  // The `-j` flag would junk paths; we want to preserve the folder
  // so the resulting "llreporter-extension/" is what users load.
  const stagingParent = path.dirname(EXT_SRC);
  const folderName = "llreporter-extension";
  const stagingDir = path.join(stagingParent, folderName);

  // Stage a copy named "llreporter-extension" so the unzipped folder is
  // self-explanatory.
  if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.cpSync(EXT_SRC, stagingDir, { recursive: true });

  try {
    execSync(`zip -r "${OUT_ZIP}" "${folderName}"`, {
      cwd: stagingParent,
      stdio: "inherit",
    });
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }

  const stat = fs.statSync(OUT_ZIP);
  log(`wrote ${path.relative(ROOT, OUT_ZIP)} (${(stat.size / 1024).toFixed(1)} KB)`);
}

(async () => {
  try {
    log("generating icons…");
    await generateIcons();
    log("zipping extension…");
    zipExtension();
    log("done.");
  } catch (err) {
    console.error("[ext-zip] FAILED:", err);
    // Don't fail the whole build — the dashboard will just show a 404
    // for the download until the next successful build.
    process.exitCode = 0;
  }
})();
