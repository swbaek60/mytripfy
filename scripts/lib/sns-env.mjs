/**
 * .env.sns 또는 process.env 에서 SNS 자격 증명 로드
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_PATH = path.join(__dirname, '..', '..', '.env.sns')

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

let fileEnv = {}
if (fs.existsSync(ENV_PATH)) {
  fileEnv = parseEnvFile(fs.readFileSync(ENV_PATH, 'utf8'))
}

export function getEnv(key, fallback = '') {
  if (key === 'SUPABASE_URL' && !process.env[key] && !fileEnv[key]) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL || fallback
  }
  return process.env[key] || fileEnv[key] || fallback
}

export function requireEnv(key) {
  const v = getEnv(key)
  if (!v) throw new Error(`Missing env: ${key} (set in .env.sns or environment)`)
  return v
}

export const META_GRAPH = 'https://graph.facebook.com/v21.0'

export function getInstagramAccounts() {
  return {
    sua: {
      igUserId: getEnv('INSTAGRAM_SUA_USER_ID'),
      accessToken: getEnv('META_ACCESS_TOKEN'),
    },
    ethan: {
      igUserId: getEnv('INSTAGRAM_ETHAN_USER_ID'),
      accessToken: getEnv('META_ACCESS_TOKEN'),
    },
  }
}

export function getYouTubeAccounts() {
  return {
    sua: {
      refreshToken: getEnv('YOUTUBE_SUA_REFRESH_TOKEN'),
      clientId: getEnv('YOUTUBE_CLIENT_ID'),
      clientSecret: getEnv('YOUTUBE_CLIENT_SECRET'),
    },
    ethan: {
      refreshToken: getEnv('YOUTUBE_ETHAN_REFRESH_TOKEN'),
      clientId: getEnv('YOUTUBE_CLIENT_ID'),
      clientSecret: getEnv('YOUTUBE_CLIENT_SECRET'),
    },
  }
}
