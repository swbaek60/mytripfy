import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const tsxPath = path.join(__dirname, '..', 'src', 'components', 'ChallengeImage.tsx')
const newBlockPath = path.join(__dirname, 'scuba-array.txt')

let tsx = fs.readFileSync(tsxPath, 'utf8')
tsx = tsx.replace(/\r\n/g, '\n')
const newBlock = fs.readFileSync(newBlockPath, 'utf8').trim().replace(/\r\n/g, '\n')

const startMark = 'const SCUBA_VERIFIED_URLS = ['
const endMark = ']\nconst SCUBA_DIRECT_IMAGES: Record'

const startIdx = tsx.indexOf(startMark)
let endIdx = tsx.indexOf(endMark)
if (endIdx === -1) {
  const dirIdx = tsx.indexOf('const SCUBA_DIRECT_IMAGES')
  if (dirIdx !== -1) endIdx = tsx.lastIndexOf(']', dirIdx)
}
if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found', { startIdx, endIdx })
  process.exit(1)
}

const before = tsx.slice(0, startIdx)
const after = tsx.slice(endIdx + 1)
tsx = before + newBlock + after
fs.writeFileSync(tsxPath, tsx)
console.log('Patched SCUBA_VERIFIED_URLS in ChallengeImage.tsx')
