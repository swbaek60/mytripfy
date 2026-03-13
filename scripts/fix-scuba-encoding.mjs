import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const tsxPath = path.join(__dirname, '..', 'src', 'components', 'ChallengeImage.tsx')
const urlsPath = path.join(__dirname, 'scuba-urls.json')

const urls = JSON.parse(fs.readFileSync(urlsPath, 'utf8'))
const lines = urls.map(u => "  '" + u + "',")
const newBlock = 'const SCUBA_VERIFIED_URLS = [\n' + lines.join('\n') + '\n]'

let tsx = fs.readFileSync(tsxPath, 'utf8').replace(/\r\n/g, '\n')
const anchorEnd = " 'Stingray City, Cayman Islands',\n]\n"
const anchorNext = '\nconst SCUBA_DIRECT_IMAGES: Record'
const idxEnd = tsx.indexOf(anchorEnd)
const idxNext = tsx.indexOf(anchorNext)
if (idxEnd === -1 || idxNext === -1) {
  console.error('Anchors not found', { idxEnd, idxNext })
  process.exit(1)
}
const startReplace = idxEnd + anchorEnd.length
const before = tsx.slice(0, startReplace)
const after = tsx.slice(idxNext)
tsx = before + newBlock + after
fs.writeFileSync(tsxPath, tsx, 'utf8')
console.log('Fixed SCUBA_VERIFIED_URLS block (UTF-8)')
