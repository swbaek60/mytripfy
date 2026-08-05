/**
 * Community Writer — value-first drafts for Reddit etc. (never auto-posts)
 */
import path from 'path'
import { OUT_COMMUNITY } from '../lib/paths.mjs'
import { writeJson, writeText, todayStr } from '../lib/write-out.mjs'
import { chat, hasLlm } from '../lib/llm.mjs'
import { COMMUNITY_TARGETS } from '../data/community-targets.mjs'
import { withUtm, UTM_SOURCES } from '../lib/utm.mjs'

function softLink() {
  return withUtm('/', {
    source: UTM_SOURCES.reddit,
    campaign: 'community',
    content: 'comment',
  })
}

function templateDraft(target, topicIndex) {
  const topic = target.topics[topicIndex % target.topics.length]
  const link = softLink()

  if (target.subreddit === 'r/solotravel') {
    return {
      title: topic,
      body: `I've been experimenting with safer ways to meet people on the road beyond hostel common rooms and random Facebook groups.

What has worked for me:
1) Match on **destination + overlapping dates** first (not vibes-only).
2) Chat in-app for a few days before sharing lodging.
3) First meetup in a public place; tell a friend your plan.
4) Prefer profiles with reviews / trust signals.

Curious what has actually worked for you in 2026 — apps, Discord, WhatsApp groups, or still pure serendipity?

(If useful: I've also been using mytripfy for date-matched companion posts + photo challenges, but I'm mostly looking for peer tips here.)`,
      commentCta: `Soft CTA (only if someone asks for the tool): ${link}`,
    }
  }

  if (target.subreddit === 'r/travelbuddies') {
    return {
      title: topic,
      body: `Trying to improve how I write companion posts so they actually get replies.

My current checklist:
- Exact city + date range in the title
- Pace (chill / packed) and budget band
- What I'm looking for (day trips vs full itinerary)
- One concrete plan for day 1

Anyone willing to roast a draft post format? Happy to share a template that worked for me.

Also: do you prefer joining someone's trip vs posting your own?`,
      commentCta: `Optional resource if asked: companion browse on mytripfy → ${link}`,
    }
  }

  if (target.subreddit === 'r/JapanTravel') {
    return {
      title: topic,
      body: `Planning Tokyo/Osaka and wondering how people meet travelers without relying only on hostel parties.

I like having a shared activity (museum, market, photo spot) for the first hang — less awkward than "want to explore?" with zero plan.

Any neighborhoods or meetup styles that worked for you (and felt safe)?

I've been pairing city days with small photo "missions" so there's a reason to walk somewhere specific — curious if others do something similar.`,
      commentCta: `If asked about the missions site: ${link}`,
    }
  }

  return {
    title: topic,
    body: `Looking for practical tips meeting travelers in Korea (especially Seoul day trips) without sketchy DMs.

What safety habits do you swear by?
- Public first meet
- Profile verification
- Mutual reviews after

Open to app recommendations if they aren't pure spam magnets.`,
    commentCta: `Soft link if requested: ${link}`,
  }
}

async function maybeLlm(target, base) {
  if (!hasLlm()) return { ...base, llm: false }
  try {
    const raw = await chat(
      `Write a Reddit post for ${target.subreddit}. Tone: ${target.tone}. No hard sell. No fake stories. JSON keys: title, body, commentCta.`,
      `Topic: ${base.title}\nDraft to improve:\n${base.body}`,
      { json: true }
    )
    if (!raw) return { ...base, llm: false }
    const parsed = JSON.parse(raw)
    return { title: parsed.title || base.title, body: parsed.body || base.body, commentCta: parsed.commentCta || base.commentCta, llm: true }
  } catch {
    return { ...base, llm: false }
  }
}

/**
 * @param {{ count?: number }} opts
 */
export async function runCommunityRole(opts = {}) {
  const count = opts.count ?? 3
  const date = todayStr()
  const out = []

  for (let i = 0; i < count; i++) {
    const target = COMMUNITY_TARGETS[i % COMMUNITY_TARGETS.length]
    const base = templateDraft(target, Math.floor(Date.now() / 86400000) + i)
    const draft = await maybeLlm(target, base)
    const payload = {
      date,
      platform: target.platform,
      subreddit: target.subreddit,
      targetId: target.id,
      status: 'pending_review',
      ...draft,
      rules: [
        'Do NOT auto-post. Human review required.',
        'Lead with value; soft-mention product only if natural.',
        'Put the URL in a reply comment if someone asks — avoid link spam in OP when subreddit rules are strict.',
      ],
    }
    const slug = `${date}-${target.id}-${i + 1}`
    const jsonPath = path.join(OUT_COMMUNITY, `${slug}.json`)
    const mdPath = path.join(OUT_COMMUNITY, `${slug}.md`)
    writeJson(jsonPath, payload)
    writeText(
      mdPath,
      `# ${payload.title}\n\n**Where:** ${payload.subreddit}  \n**Status:** ${payload.status}\n\n---\n\n${payload.body}\n\n---\n\n### Comment CTA (optional)\n${payload.commentCta}\n`
    )
    out.push({ file: mdPath, subreddit: target.subreddit, title: payload.title })
  }

  return { role: 'community', ok: true, drafts: out, llm: hasLlm() }
}
