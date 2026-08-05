/**
 * Launch Packager — Product Hunt, directories, outreach, seed Reddit threads
 */
import path from 'path'
import { OUT_LAUNCH, SITE_URL } from '../lib/paths.mjs'
import { writeJson, writeText, todayStr } from '../lib/write-out.mjs'
import { withUtm, UTM_SOURCES } from '../lib/utm.mjs'
import { chat, hasLlm } from '../lib/llm.mjs'

function basePack() {
  const phUrl = withUtm('/', { source: UTM_SOURCES.producthunt, campaign: 'launch', content: 'ph' })
  const dirUrl = withUtm('/', { source: UTM_SOURCES.directory, campaign: 'listings', content: 'dir' })
  const outUrl = withUtm('/', { source: UTM_SOURCES.outreach, campaign: 'blogger', content: 'email' })

  return {
    generatedAt: todayStr(),
    site: SITE_URL,
    productHunt: {
      name: 'mytripfy',
      tagline: 'Find travel companions, local guides & 100-country photo challenges',
      description: `mytripfy is a free social travel platform. Match with verified companions by destination and dates, book local guides with trust scores, and complete 1,600 photo-verified missions across 100 countries. Earn Hall of Fame points, leave mutual reviews, and turn every trip into a shared adventure — no ads required to join.`,
      topics: ['Travel', 'Social Networking', 'Indie Games', 'Productivity'],
      galleryCaptions: [
        'Homepage: companions, guides, and challenges in one place',
        'Companion posts filtered by destination and dates',
        '100 Countries Challenge stamp feed',
        'Local guide profiles with ratings',
        'Hall of Fame leaderboard',
      ],
      makerComment: `Hey Product Hunt 👋

I built mytripfy because solo travel apps were either dating-adjacent, Facebook-group chaos, or itinerary tools with zero people.

What you get today (all free):
• Companion matching by city + dates
• Local guides with reviews & trust scores
• 1,600 photo challenges across 100 countries
• Mutual reviews after meetups

Would love feedback from travelers and builders — especially on onboarding and trust.

Try it: ${phUrl}`,
      launchChecklist: [
        'Create Product Hunt maker account',
        'Upload 5 screenshots + logo',
        'Schedule launch (Tue–Thu PT preferred)',
        'Prepare hunter or self-hunt',
        'Notify existing users the night before',
        'Pin maker first comment at launch',
      ],
    },
    directories: [
      {
        name: "There's An AI For That",
        category: 'Travel',
        oneLiner: 'AI-assisted travel companion matching + gamified 100-country challenges',
        url: dirUrl,
      },
      {
        name: 'Futurepedia',
        category: 'Lifestyle / Travel',
        oneLiner: 'Find travel buddies, local guides, and photo-verified travel quests',
        url: dirUrl,
      },
      {
        name: 'AlternativeTo',
        category: 'Travel social',
        oneLiner: 'Free alternative to fragmented Facebook travel groups — companions + guides + challenges',
        url: dirUrl,
      },
      {
        name: 'BetaList',
        category: 'Startup',
        oneLiner: 'Social travel game: companions, guides, 100-country stamps',
        url: dirUrl,
      },
      {
        name: 'SaaSHub',
        category: 'Travel',
        oneLiner: 'Travel companion community with challenges and local guides',
        url: dirUrl,
      },
    ],
    redditSeedThreads: [
      {
        subreddit: 'r/solotravel',
        title: 'I built a free companion + challenge platform after getting tired of Facebook travel groups — feedback welcome',
        body: `Not trying to spam — genuinely want critique from people who actually travel solo.

Problem I kept hitting: finding someone with **overlapping dates in the same city**, then having zero trust signals.

What I shipped: date/city companion posts, local guides with reviews, and photo challenges (stamp when you visit).

What I'd love from this community:
1) What would make you trust a stranger from an app?
2) What features feel creepy / dating-app adjacent that I should avoid?

Happy to take brutal feedback.`,
      },
      {
        subreddit: 'r/SideProject',
        title: 'Show HN-style: mytripfy — companions, guides, 100-country photo challenges (free)',
        body: `Built for travelers who want people + proof-of-visit, not another itinerary generator.

Stack: Next.js + Supabase. Organic growth only (no ads budget).

Looking for: onboarding UX feedback and whether the challenge loop is clear.`,
      },
      {
        subreddit: 'r/digitalnomad',
        title: 'Anyone else struggle to meet people in a new city for just 3–5 days?',
        body: `When you're only somewhere briefly, Facebook groups are too slow and Meetups are hit-or-miss.

I've been testing date-overlap companion matching + shared "missions" as icebreakers.

What works for you on short city hops?`,
      },
    ],
    outreachEmails: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      subject:
        i % 2 === 0
          ? 'Quick idea for your readers: safer travel companion matching'
          : 'Free tool for solo travelers — would love your honest take',
      body: `Hi {{name}},

I'm the maker of mytripfy (${outUrl}) — a free platform for travel companions, local guides, and photo-verified country challenges.

No ask for a sponsored post. If it fits your audience, I'd love either:
• a honest try + critique, or
• a mention in a roundup if you already cover solo travel tools.

Happy to give your readers a founder AMA or a custom companion guide for a city you cover.

Thanks for reading,
{{signature}}`,
    })),
    crossPostCaptions: {
      threads: 'Travel together. Explore smarter. Play the world. — companions, guides, 100-country challenges on mytripfy (free)',
      x: 'Solo but not alone: match companions by city+dates, book local guides, stamp 100-country challenges. Free → mytripfy.com',
      tiktokHook: 'POV: you finally find a travel buddy with the SAME dates in your city',
    },
  }
}

export async function runLaunchRole() {
  let pack = basePack()
  if (hasLlm()) {
    try {
      const raw = await chat(
        'Improve Product Hunt makerComment and tagline for clarity. Keep facts accurate for mytripfy. Return JSON with keys tagline, makerComment.',
        JSON.stringify({
          tagline: pack.productHunt.tagline,
          makerComment: pack.productHunt.makerComment,
        }),
        { json: true }
      )
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.tagline) pack.productHunt.tagline = parsed.tagline
        if (parsed.makerComment) pack.productHunt.makerComment = parsed.makerComment
        pack.llm = true
      }
    } catch {
      pack.llm = false
    }
  }

  const dir = OUT_LAUNCH
  writeJson(path.join(dir, 'launch-pack.json'), pack)
  writeText(
    path.join(dir, 'PRODUCT_HUNT.md'),
    `# Product Hunt — mytripfy\n\n**Tagline:** ${pack.productHunt.tagline}\n\n## Description\n\n${pack.productHunt.description}\n\n## Maker first comment\n\n${pack.productHunt.makerComment}\n\n## Checklist\n\n${pack.productHunt.launchChecklist.map((x) => `- [ ] ${x}`).join('\n')}\n`
  )
  writeText(
    path.join(dir, 'DIRECTORIES.md'),
    `# Directory submissions\n\n${pack.directories.map((d) => `## ${d.name}\n- Category: ${d.category}\n- One-liner: ${d.oneLiner}\n- URL: ${d.url}\n`).join('\n')}`
  )
  writeText(
    path.join(dir, 'REDDIT_SEEDS.md'),
    pack.redditSeedThreads.map((t) => `## ${t.subreddit}\n\n### ${t.title}\n\n${t.body}\n`).join('\n---\n\n')
  )
  writeText(
    path.join(dir, 'OUTREACH.md'),
    pack.outreachEmails.map((e) => `## Email ${e.id}\n\n**Subject:** ${e.subject}\n\n${e.body}\n`).join('\n---\n\n')
  )
  writeText(
    path.join(dir, 'CROSSPOST.txt'),
    Object.entries(pack.crossPostCaptions)
      .map(([k, v]) => `${k}:\n${v}\n`)
      .join('\n')
  )

  return {
    role: 'launch',
    ok: true,
    dir,
    files: ['launch-pack.json', 'PRODUCT_HUNT.md', 'DIRECTORIES.md', 'REDDIT_SEEDS.md', 'OUTREACH.md', 'CROSSPOST.txt'],
    llm: Boolean(pack.llm),
  }
}
