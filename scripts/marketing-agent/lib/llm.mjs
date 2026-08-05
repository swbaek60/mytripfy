/**
 * Optional LLM for marketing copy. Falls back to null when no key.
 * Prefer OPENAI, then Gemini.
 */
import './load-env.mjs'
import { getEnv } from '../../lib/sns-env.mjs'

export function hasLlm() {
  return Boolean(getEnv('OPENAI_API_KEY') || getEnv('GEMINI_API_KEY'))
}

/**
 * @param {string} system
 * @param {string} user
 * @param {{ json?: boolean }} opts
 * @returns {Promise<string|null>}
 */
export async function chat(system, user, opts = {}) {
  const openai = getEnv('OPENAI_API_KEY')
  if (openai) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openai}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getEnv('MARKETING_LLM_MODEL', 'gpt-4o-mini'),
        temperature: 0.7,
        response_format: opts.json ? { type: 'json_object' } : undefined,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`OpenAI chat failed: ${res.status} ${t.slice(0, 200)}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  }

  const gemini = getEnv('GEMINI_API_KEY')
  if (gemini) {
    const model = getEnv('MARKETING_GEMINI_MODEL', 'gemini-2.0-flash')
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gemini}`
    const prompt = `${system}\n\n---\n\n${user}${opts.json ? '\n\nRespond with valid JSON only.' : ''}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: opts.json ? 'application/json' : 'text/plain',
        },
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`Gemini chat failed: ${res.status} ${t.slice(0, 200)}`)
    }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('')?.trim() || null
  }

  return null
}
