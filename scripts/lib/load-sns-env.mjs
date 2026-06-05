/**
 * .env.local + .env.sns 를 process.env 에 병합 (이미 설정된 값은 유지)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

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

const ENV_ALIASES = [
  ['OPENAI_API_KEY', ['OPENAI_KEY', 'OPENAI_SECRET', 'OPENAI_APIKEY']],
]

function applyAliases() {
  for (const [canonical, aliases] of ENV_ALIASES) {
    if (process.env[canonical]) continue
    for (const a of aliases) {
      if (process.env[a]) {
        process.env[canonical] = process.env[a]
        break
      }
    }
  }
}

function loadSecretsDir() {
  const dir = path.join(ROOT, 'secrets')
  if (!fs.existsSync(dir)) return
  const map = {
    'openai.txt': 'OPENAI_API_KEY',
    'openai.key': 'OPENAI_API_KEY',
    'gemini.txt': 'GEMINI_API_KEY',
    'google-ai.txt': 'GEMINI_API_KEY',
    'meta-token.txt': 'META_ACCESS_TOKEN',
    'instagram-sua-id.txt': 'INSTAGRAM_SUA_USER_ID',
    'instagram-ethan-id.txt': 'INSTAGRAM_ETHAN_USER_ID',
  }
  for (const [file, envKey] of Object.entries(map)) {
    const p = path.join(dir, file)
    if (!fs.existsSync(p)) continue
    const val = fs.readFileSync(p, 'utf8').trim().split('\n')[0].trim()
    if (val && (!process.env[envKey] || process.env[envKey] === '')) {
      process.env[envKey] = val
    }
  }
}

export function loadSnsEnv() {
  loadFile('.env.local')
  loadFile('.env.sns')
  loadSecretsDir()
  applyAliases()
}

loadSnsEnv()
