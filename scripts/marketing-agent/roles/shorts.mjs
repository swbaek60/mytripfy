/**
 * Going Solo / TripBFF style short-form hooks — beachhead city variants
 * Output: scripts/out/marketing/shorts/ (TikTok + Reels + caption)
 */
import path from 'path'
import { OUT_SHORTS } from '../lib/paths.mjs'
import { writeJson, writeText, todayStr } from '../lib/write-out.mjs'
import { withUtm, UTM_SOURCES } from '../lib/utm.mjs'
import { BEACHHEAD } from '../data/growth-cities.mjs'

const PAIN_HOOKS = [
  'i want to travel the world but no one to go with',
  'solo in {city} and kind of lonely tbh',
  'wonders if i’ll meet any new friends in {city}',
  'i wish there was an app to find travelers with the SAME dates',
  'stop joining random Facebook travel groups',
  'same city. same dates. that’s the only match that works.',
  'traveling alone doesn’t mean eating alone every night',
  'POV: you finally find a buddy with overlapping dates in {city}',
]

const DEMO_BEATS = [
  'Open mytripfy → Companions',
  'Filter {city} + your dates',
  'Chat in-app → meet in public',
  'Optional: stamp a photo challenge together',
]

function fill(template, city) {
  return template.replaceAll('{city}', city)
}

/**
 * @param {{ count?: number }} opts
 */
export async function runShortsRole(opts = {}) {
  const date = todayStr()
  const count = opts.count ?? 12
  const items = []

  for (let i = 0; i < count; i++) {
    const city = BEACHHEAD[i % BEACHHEAD.length]
    const hook = fill(PAIN_HOOKS[i % PAIN_HOOKS.length], city.labelEn)
    const url = withUtm(`/destinations/${city.id}`, {
      source: UTM_SOURCES.youtube,
      campaign: 'shorts-hook',
      content: `${city.id}-${i + 1}`,
    })
    const tiktokUrl = withUtm(`/destinations/${city.id}`, {
      source: 'tiktok',
      campaign: 'shorts-hook',
      content: `${city.id}-${i + 1}`,
    })
    const reelsUrl = withUtm(`/destinations/${city.id}`, {
      source: 'instagram',
      medium: 'reels',
      campaign: 'shorts-hook',
      content: `${city.id}-${i + 1}`,
    })

    const beats = DEMO_BEATS.map((b) => fill(b, city.labelEn))
    const script = [
      `HOOK (on-screen text, 0–2s): "${hook}"`,
      '',
      'VISUAL: face-to-camera OR wall-of-text on travel B-roll (3–8s)',
      ...beats.map((b, idx) => `${idx + 1}) ${b}`),
      '',
      `END CARD: free · mytripfy`,
      `TikTok link in bio / comment: ${tiktokUrl}`,
      `Reels: ${reelsUrl}`,
      `Shorts desc link: ${url}`,
    ].join('\n')

    const caption = `${hook}\n\nMatch companions by city + dates on mytripfy (free).\n\n#solotravel #travelbuddy #${city.labelEn.replace(/\s/g, '')} #mytripfy`

    const id = `${date}-${city.id}-${String(i + 1).padStart(2, '0')}`
    const payload = {
      id,
      date,
      city: city.id,
      cityEn: city.labelEn,
      hook,
      beats,
      script,
      caption,
      urls: { tiktok: tiktokUrl, reels: reelsUrl, shorts: url },
      status: 'ready_to_post',
      note: 'Human or CapCut posts video; AI prepared hook+script. Do not spam identical posts — rotate cities/hooks.',
    }
    writeJson(path.join(OUT_SHORTS, `${id}.json`), payload)
    writeText(path.join(OUT_SHORTS, `${id}.txt`), `${script}\n\n---\nCAPTION\n---\n${caption}\n`)
    items.push({ id, city: city.labelEn, hook })
  }

  const indexPath = path.join(OUT_SHORTS, `${date}-INDEX.md`)
  writeText(
    indexPath,
    `# Short-form hooks — ${date}\n\nPost 1–3/day. Rotate cities.\n\n${items.map((x, i) => `${i + 1}. **${x.city}** — ${x.hook} (\`${x.id}.txt\`)`).join('\n')}\n`
  )

  return { role: 'shorts', ok: true, count: items.length, index: indexPath, items }
}
