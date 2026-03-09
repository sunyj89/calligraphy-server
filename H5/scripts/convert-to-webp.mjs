import sharp from 'sharp'
import { readdir } from 'fs/promises'
import { join, basename, extname } from 'path'

const inputDir = new URL('../public/images/tree', import.meta.url).pathname

const files = await readdir(inputDir)
const pngs = files.filter(f => extname(f) === '.png')

for (const file of pngs) {
  const input = join(inputDir, file)
  const output = join(inputDir, basename(file, '.png') + '.webp')
  await sharp(input).webp({ quality: 80 }).toFile(output)
  console.log(`converted: ${file} → ${basename(output)}`)
}
