import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const svg = readFileSync(resolve('public/favicon.svg'))

const sizes = [
  { file: 'public/apple-touch-icon.png', size: 180 },
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'public/icons/icon-512.png', size: 512 },
]

for (const { file, size } of sizes) {
  await sharp(svg)
    .resize(size, size, { kernel: sharp.kernel.nearest })
    .png()
    .toFile(file)
  console.log(`Created ${file} (${size}x${size})`)
}
