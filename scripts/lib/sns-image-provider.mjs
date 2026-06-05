/**
 * SNS 이미지 생성
 * - gemini: Google Gemini (Nano Banana) — AI Studio 무료 한도, 품질 좋음 (권장)
 * - pollinations: 완전 무료·키 없음 — 대기열 제한 있음 (순차+재시도)
 * - huggingface: HF_TOKEN 무료 한도
 * - openai: 유료 DALL·E
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getEnv } from './sns-env.mjs'
import { PHOTO_REALISM } from './sns-campaign-config.mjs'

function ensurePhotoRealism(prompt) {
  if (prompt.includes('NOT illustration')) return prompt
  return PHOTO_REALISM.prefix + prompt + PHOTO_REALISM.suffix
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS_SNS = path.join(__dirname, '..', '..', 'assets', 'sns')

const POLLINATIONS_DELAY_MS = 15000
const DEFAULT_DELAY_MS = 5000

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export function resolveImageProvider() {
  const explicit = getEnv('SNS_IMAGE_PROVIDER', '').toLowerCase()
  const allowed = ['gemini', 'pollinations', 'openai', 'huggingface']
  if (allowed.includes(explicit)) return explicit
  if (getEnv('GEMINI_API_KEY') || getEnv('GOOGLE_AI_API_KEY')) return 'gemini'
  if (getEnv('OPENAI_API_KEY')) return 'openai'
  if (getEnv('HF_TOKEN') || getEnv('HUGGINGFACE_API_KEY')) return 'huggingface'
  return 'pollinations'
}

function getGeminiKey() {
  return getEnv('GEMINI_API_KEY') || getEnv('GOOGLE_AI_API_KEY')
}

function getGeminiModel() {
  return getEnv('GEMINI_IMAGE_MODEL', 'gemini-2.0-flash-preview-image-generation')
}

function readRefImageBase64(character) {
  const file = getEnv(`SNS_REF_IMAGE_${character.toUpperCase()}`, '') ||
    path.join(ASSETS_SNS, `${character}-ref-front.png`)
  if (!fs.existsSync(file)) return null
  const buf = fs.readFileSync(file)
  return { mime: 'image/png', data: buf.toString('base64') }
}

async function generatePollinations(prompt, attempt = 1) {
  const width = getEnv('SNS_IMAGE_WIDTH', '1024')
  const height = getEnv('SNS_IMAGE_HEIGHT', '1024')
  const model = getEnv('SNS_IMAGE_MODEL', 'flux')
  const params = new URLSearchParams({ width, height, model, enhance: 'true' })
  const token = getEnv('POLLINATIONS_API_KEY', '')
  if (token) params.set('key', token)

  const url =
    'https://image.pollinations.ai/prompt/' +
    encodeURIComponent(ensurePhotoRealism(prompt)) +
    '?' +
    params.toString()

  const res = await fetch(url, { redirect: 'follow' })
  if (res.status === 402 && attempt < 4) {
    const wait = 20000 * attempt
    console.log(`    Pollinations 대기열 만료 — ${wait / 1000}초 후 재시도 (${attempt}/3)`)
    await sleep(wait)
    return generatePollinations(prompt, attempt + 1)
  }
  if (!res.ok) throw new Error('Pollinations: ' + res.status + ' ' + (await res.text()).slice(0, 200))
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 1000) throw new Error('Pollinations: empty image')
  return buf
}

async function generateGemini(prompt, character = '') {
  const key = getGeminiKey()
  if (!key) throw new Error('GEMINI_API_KEY missing — https://aistudio.google.com/apikey')
  const model = getGeminiModel()

  const parts = []
  const ref = character ? readRefImageBase64(character) : null
  if (ref) {
    parts.push({
      inlineData: { mimeType: ref.mime, data: ref.data },
    })
    parts.push({
      text:
        'Generate a real unedited travel photograph of the SAME person as the reference. ' +
        ensurePhotoRealism(prompt) +
        ' Keep face identity. No watermark no text.',
    })
  } else {
    parts.push({ text: ensurePhotoRealism(prompt) })
  }

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    model +
    ':generateContent?key=' +
    encodeURIComponent(key)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error('Gemini: ' + (json.error?.message || res.status + ' ' + JSON.stringify(json).slice(0, 300)))
  }

  const candidate = json.candidates?.[0]?.content?.parts || []
  for (const part of candidate) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64')
    }
  }
  throw new Error('Gemini: no image in response')
}

async function generateOpenAI(prompt) {
  const key = getEnv('OPENAI_API_KEY')
  if (!key) throw new Error('OPENAI_API_KEY missing')
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + key,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
      quality: 'standard',
    }),
  })
  if (!res.ok) throw new Error('DALL·E: ' + res.status + ' ' + (await res.text()))
  const data = await res.json()
  const b64 = data.data?.[0]?.b64_json
  if (!b64) throw new Error('DALL·E: no image')
  return Buffer.from(b64, 'base64')
}

async function generateHuggingFace(prompt) {
  const token = getEnv('HF_TOKEN') || getEnv('HUGGINGFACE_API_KEY')
  if (!token) throw new Error('HF_TOKEN missing')
  const model = getEnv('HF_IMAGE_MODEL', 'black-forest-labs/FLUX.1-schnell')
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: prompt }),
  })
  if (!res.ok) throw new Error('HuggingFace: ' + res.status + ' ' + (await res.text()).slice(0, 300))
  return Buffer.from(await res.arrayBuffer())
}

/**
 * @param {string} prompt
 * @param {{ character?: 'sua'|'ethan' }} opts
 */
export async function generateImageBuffer(prompt, opts = {}) {
  const provider = resolveImageProvider()
  const character = opts.character || ''
  switch (provider) {
    case 'gemini':
      return generateGemini(prompt, character)
    case 'openai':
      return generateOpenAI(prompt)
    case 'huggingface':
      return generateHuggingFace(prompt)
    case 'pollinations':
    default:
      return generatePollinations(prompt)
  }
}

export function getImageProviderLabel() {
  return resolveImageProvider()
}

export function getImageDelayMs() {
  return resolveImageProvider() === 'pollinations' ? POLLINATIONS_DELAY_MS : DEFAULT_DELAY_MS
}

export const IMAGE_DELAY_MS = DEFAULT_DELAY_MS
export { sleep }
