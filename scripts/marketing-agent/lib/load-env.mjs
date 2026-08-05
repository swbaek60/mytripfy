/**
 * Load .env.local + .env.sns into process.env for marketing scripts
 * (mirrors scripts/lib/load-sns-env.mjs without circular import issues)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

function parseEnvFile(content) {
  const out = {}
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function loadFile(relPath) {
  const full = path.join(ROOT, relPath)
  if (!fs.existsSync(full)) return
  const parsed = parseEnvFile(fs.readFileSync(full, 'utf8'))
  for (const [k, v] of Object.entries(parsed)) {
    if (process.env[k] === undefined || process.env[k] === '') {
      process.env[k] = v
    }
  }
}

loadFile('.env.local')
loadFile('.env.sns')
