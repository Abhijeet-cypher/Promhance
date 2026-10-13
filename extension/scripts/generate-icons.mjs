#!/usr/bin/env node
/**
 * Generates the extension's PNG icons from the Promhance brand mark without
 * any image dependencies. Writes public/icon/{16,32,48,128}.png.
 *
 * Run with: node scripts/generate-icons.mjs
 */

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "icon");
mkdirSync(outDir, { recursive: true });

const BLUE = [59, 130, 246];
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function png(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixels(x, y);
      const off = y * (size * 4 + 1) + 1 + x * 4;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Signed distance to a rounded square centered at (cx,cy). */
function insideRoundedSquare(x, y, cx, cy, half, radius) {
  const dx = Math.abs(x - cx) - (half - radius);
  const dy = Math.abs(y - cy) - (half - radius);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.hypot(ax, ay) - radius <= 0;
}

/** A 4-point star (sparkle) mask around center. */
function insideStar(x, y, cx, cy, outer, inner) {
  const dx = x - cx;
  const dy = y - cy;
  const angle = Math.atan2(dy, dx);
  const radius = Math.hypot(dx, dy);
  // 4-point star: spikes along axes.
  const a = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const t = ((a % (Math.PI / 2)) - Math.PI / 4) / (Math.PI / 4); // -1..1
  const maxR = inner + (outer - inner) * (1 - Math.abs(t));
  return radius <= maxR;
}

function makePixels(size) {
  const cx = size / 2;
  const cy = size / 2;
  const half = size * 0.44;
  const radius = size * 0.24;
  const outer = size * 0.34;
  const inner = size * 0.07;

  return (x, y) => {
    // Supersample 3x3 for smooth edges.
    let bg = 0;
    let fg = 0;
    let total = 0;
    for (let sy = 0; sy < 3; sy++) {
      for (let sx = 0; sx < 3; sx++) {
        const px = x + (sx + 0.5) / 3;
        const py = y + (sy + 0.5) / 3;
        total++;
        if (insideStar(px, py, cx, cy, outer, inner)) fg++;
        else if (insideRoundedSquare(px, py, cx, cy, half, radius)) bg++;
      }
    }
    const a = ((bg + fg) / total) * 255;
    if (fg > 0 && fg >= bg) {
      // Blend white star over blue background proportionally.
      const starRatio = fg / total;
      const whiteRatio = Math.min(1, starRatio / Math.max(starRatio + bg / total, 0.001));
      const r = Math.round(BLUE[0] * (1 - whiteRatio) + WHITE[0] * whiteRatio);
      const g = Math.round(BLUE[1] * (1 - whiteRatio) + WHITE[1] * whiteRatio);
      const b = Math.round(BLUE[2] * (1 - whiteRatio) + WHITE[2] * whiteRatio);
      return [r, g, b, Math.round(a)];
    }
    return [BLUE[0], BLUE[1], BLUE[2], Math.round(a)];
  };
}

for (const size of [16, 32, 48, 128]) {
  const buf = png(size, makePixels(size));
  writeFileSync(join(outDir, `${size}.png`), buf);
  console.log(`wrote public/icon/${size}.png (${buf.length} bytes)`);
}
