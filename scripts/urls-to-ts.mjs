import fs from 'fs'
const urls = JSON.parse(fs.readFileSync(new URL('./scuba-urls.json', import.meta.url), 'utf8'))
const lines = urls.map(u => "  '" + u + "',")
console.log('const SCUBA_VERIFIED_URLS = [')
console.log(lines.join('\n'))
console.log(']')
