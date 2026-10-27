import { deflate, deflateSync, constants } from 'node:zlib';
import { promisify } from 'node:util';
import type { RawImage } from '../types';

// Pure-JS PNG on top of node:zlib: no native encoder to ship, and the deflate
// (the only expensive part) already runs on the libuv pool in the async path.
// A SIMD encoder (fpng/spng) in the addon is the upgrade path if this shows up
// in profiles.

const deflateAsync = promisify(deflate);
const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ZLIB_OPTIONS = { level: 6, strategy: constants.Z_FILTERED };

let crcTable: Uint32Array | null = null;

function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  out.set(data, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

// Every scanline gets filter type 0 (None): the cheapest choice, and for flat
// vector art deflate does most of the work anyway.
function scanlines({ data, width, height }: RawImage): Buffer {
  const stride = width * 4;
  const out = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    out.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  return out;
}

function assemble(image: RawImage, compressed: Uint8Array): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  return Buffer.concat([SIGNATURE, chunk('IHDR', header), chunk('IDAT', compressed), chunk('IEND', new Uint8Array(0))]);
}

export function encodePng(image: RawImage, sync: true): Buffer;
export function encodePng(image: RawImage, sync: false): Promise<Buffer>;
export function encodePng(image: RawImage, sync: boolean): Buffer | Promise<Buffer> {
  const raw = scanlines(image);
  if (sync) return assemble(image, deflateSync(raw, ZLIB_OPTIONS));
  return deflateAsync(raw, ZLIB_OPTIONS).then((compressed) => assemble(image, compressed));
}
