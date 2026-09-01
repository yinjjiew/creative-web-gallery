/**
 * A run is a name, a finish, and the steer that produced it.
 *
 * The ghost is trustworthy only if we replay the same inputs through the same
 * fixed-timestep stepper — so we store the input stream, not positions. RLE
 * keeps a thirty-second line well under a few hundred URL characters. The
 * payload lives in the hash, so even this page's own server never sees it.
 *
 * Layout, version 1:
 *   u8  version = 1
 *   u8  name length
 *   utf8 name
 *   u16 little-endian tick count (one steer per tick)
 *   u8  misses
 *   u8  flags: bit0 finished, bit1 dnf
 *   u16 little-endian RLE length
 *   RLE bytes: top 2 bits = steer+1 (0 left, 1 none, 2 right),
 *              low 6 bits = run length minus one (1–64)
 *   u8  xor of every preceding byte
 */

import type { Steer } from "./sim";

export const CODEC_VERSION = 1;
export const MAX_NAME = 20;
export const HASH_PREFIX = "s=";

export interface PackedRun {
  name: string;
  steers: Steer[];
  misses: number;
  finished: boolean;
  dnf: boolean;
}

const NAME_OK = /[^\p{L}\p{N} .'\-]/gu;

export function cleanName(raw: string): string {
  return raw.normalize("NFC").replace(NAME_OK, "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

function packByte(steer: Steer, n: number): number {
  return ((steer + 1) << 6) | (n - 1);
}

function rle(steers: Steer[]): number[] {
  const out: number[] = [];
  if (!steers.length) return out;
  let cur = steers[0];
  let n = 1;
  for (let i = 1; i < steers.length; i++) {
    if (steers[i] === cur && n < 64) {
      n++;
    } else {
      out.push(packByte(cur, n));
      cur = steers[i];
      n = 1;
    }
  }
  out.push(packByte(cur, n));
  return out;
}

function expand(bytes: Uint8Array): Steer[] | null {
  const out: Steer[] = [];
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    const dir = (b >> 6) & 0b11;
    if (dir > 2) return null;
    const n = (b & 0b111111) + 1;
    const steer = (dir - 1) as Steer;
    for (let k = 0; k < n; k++) out.push(steer);
  }
  return out;
}

function xorAll(bytes: Uint8Array, end: number): number {
  let x = 0;
  for (let i = 0; i < end; i++) x ^= bytes[i];
  return x & 0xff;
}

function toB64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64(s: string): Uint8Array | null {
  if (!s || /[^A-Za-z0-9\-_]/u.test(s)) return null;
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function put16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function get16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

export function encodeRun(run: PackedRun): string {
  const name = new TextEncoder().encode(cleanName(run.name));
  const packed = rle(run.steers);
  const body = new Uint8Array(1 + 1 + name.length + 2 + 1 + 1 + 2 + packed.length + 1);
  const view = new DataView(body.buffer);
  let o = 0;
  body[o++] = CODEC_VERSION;
  body[o++] = name.length;
  body.set(name, o);
  o += name.length;
  put16(view, o, run.steers.length);
  o += 2;
  body[o++] = Math.min(255, run.misses);
  body[o++] = (run.finished ? 1 : 0) | (run.dnf ? 2 : 0);
  put16(view, o, packed.length);
  o += 2;
  for (let i = 0; i < packed.length; i++) body[o++] = packed[i];
  body[o] = xorAll(body, o);
  return HASH_PREFIX + toB64(body);
}

export function decodeRun(hash: string): PackedRun | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.startsWith(HASH_PREFIX)) return null;
  const bytes = fromB64(raw.slice(HASH_PREFIX.length));
  if (!bytes || bytes.length < 9) return null;
  if (bytes[bytes.length - 1] !== xorAll(bytes, bytes.length - 1)) return null;
  if (bytes[0] !== CODEC_VERSION) return null;
  const nameLen = bytes[1];
  if (nameLen > MAX_NAME * 3 || 2 + nameLen + 7 > bytes.length) return null;
  let o = 2;
  const nameBytes = bytes.subarray(o, o + nameLen);
  o += nameLen;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ticks = get16(view, o);
  o += 2;
  const misses = bytes[o++];
  const flags = bytes[o++];
  const nRle = get16(view, o);
  o += 2;
  if (o + nRle + 1 !== bytes.length) return null;
  if (ticks > 90 * 60 || nRle > 90 * 60) return null;
  const steers = expand(bytes.subarray(o, o + nRle));
  if (!steers || steers.length !== ticks) return null;
  const name = cleanName(new TextDecoder().decode(nameBytes));
  return {
    name: name || "a skier",
    steers,
    misses,
    finished: (flags & 1) !== 0,
    dnf: (flags & 2) !== 0,
  };
}

export function readHash(hash = typeof window === "undefined" ? "" : window.location.hash): PackedRun | null {
  try {
    return decodeRun(hash);
  } catch {
    return null;
  }
}

export function formatTime(ticks: number, dt: number): string {
  const t = ticks * dt;
  const s = Math.floor(t);
  const c = Math.floor((t - s) * 100);
  return `${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
}

export function signedSplit(playerTicks: number, ghostTicks: number, dt: number): string {
  const d = (playerTicks - ghostTicks) * dt;
  const abs = Math.abs(d);
  const body = abs.toFixed(2);
  if (d > 0.005) return `+${body}`;
  if (d < -0.005) return `−${body}`;
  return "0.00";
}
