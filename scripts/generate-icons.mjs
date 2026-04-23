// Generates PWA and Apple icons using only Node.js built-ins.
// Color: #4C2FFF (r=76, g=47, b=255) — TekMi Inn brand primary.
import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'

function crc32(buf) {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  let crc = 0xFFFFFFFF
  for (const byte of buf) crc = t[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data)
  const len = Buffer.allocUnsafe(4)
  len.writeUInt32BE(d.length)
  const crcBuf = Buffer.allocUnsafe(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, d])))
  return Buffer.concat([len, t, d, crcBuf])
}

function makePng(size, r, g, b) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: RGB
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  // Scanlines: 1 filter byte (None=0) + RGB per pixel
  const rowLen = 1 + size * 3
  const raw = Buffer.allocUnsafe(size * rowLen)
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0
    for (let x = 0; x < size; x++) {
      const i = y * rowLen + 1 + x * 3
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

function makeIco32(r, g, b) {
  const width = 32
  const height = 32
  const xorSize = width * height * 4
  const andRowSize = Math.ceil(width / 32) * 4
  const andSize = andRowSize * height

  const bi = Buffer.alloc(40)
  bi.writeUInt32LE(40, 0) // BITMAPINFOHEADER size
  bi.writeInt32LE(width, 4)
  bi.writeInt32LE(height * 2, 8) // XOR + AND masks
  bi.writeUInt16LE(1, 12) // planes
  bi.writeUInt16LE(32, 14) // bits per pixel
  bi.writeUInt32LE(0, 16) // BI_RGB
  bi.writeUInt32LE(xorSize + andSize, 20)
  bi.writeInt32LE(0, 24)
  bi.writeInt32LE(0, 28)
  bi.writeUInt32LE(0, 32)
  bi.writeUInt32LE(0, 36)

  const xor = Buffer.alloc(xorSize)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // DIB pixels are stored bottom-up in BGRA order.
      const row = height - 1 - y
      const i = (row * width + x) * 4
      xor[i] = b
      xor[i + 1] = g
      xor[i + 2] = r
      xor[i + 3] = 255
    }
  }

  const andMask = Buffer.alloc(andSize) // fully opaque
  const dib = Buffer.concat([bi, xor, andMask])

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)

  const entry = Buffer.alloc(16)
  entry.writeUInt8(width, 0)
  entry.writeUInt8(height, 1)
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(dib.length, 8)
  entry.writeUInt32LE(6 + 16, 12)

  return Buffer.concat([header, entry, dib])
}

mkdirSync('public/icons', { recursive: true })

// #4C2FFF
const [r, g, b] = [0x4C, 0x2F, 0xFF]
writeFileSync('public/icons/pwa-192.png', makePng(192, r, g, b))
writeFileSync('public/icons/pwa-512.png', makePng(512, r, g, b))
writeFileSync('public/icons/pwa-maskable-512.png', makePng(512, r, g, b))
writeFileSync('public/icons/apple-touch-icon.png', makePng(180, r, g, b))
writeFileSync('public/icons/favicon-32.png', makePng(32, r, g, b))
writeFileSync('public/favicon.ico', makeIco32(r, g, b))

console.log('Generated: public/icons/pwa-192.png (192x192 #4C2FFF)')
console.log('Generated: public/icons/pwa-512.png (512x512 #4C2FFF)')
console.log('Generated: public/icons/pwa-maskable-512.png (512x512 maskable #4C2FFF)')
console.log('Generated: public/icons/apple-touch-icon.png (180x180 #4C2FFF)')
console.log('Generated: public/icons/favicon-32.png (32x32 #4C2FFF)')
console.log('Generated: public/favicon.ico (32x32 ICO #4C2FFF)')
