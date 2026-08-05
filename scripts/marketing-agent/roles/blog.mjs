/**
 * SEO Blogger — generates KO/EN blog article drafts for beachhead topics
 */
import fs from 'fs'
import path from 'path'
import { OUT_BLOG } from '../lib/paths.mjs'
import { writeJson, todayStr } from '../lib/write-out.mjs'
import { chat, hasLlm } from '../lib/llm.mjs'
import { nextUnpublishedTopics } from '../data/blog-topics.mjs'
import { withUtm, UTM_SOURCES } from '../lib/utm.mjs'
import { ROOT } from '../lib/paths.mjs'

function readExistingSlugs() {
  const p = path.join(ROOT, 'src', 'data', 'blog-articles.ts')
  const src = fs.readFileSync(p, 'utf8')
  const m = src.match(/BLOG_SLUGS\s*=\s*\[([\s\S]*?)\]\s*as const/)
  const fromSite = m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : []
  const fromDrafts = fs.existsSync(OUT_BLOG)
    ? fs.readdirSync(OUT_BLOG).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
    : []
  return [...new Set([...fromSite, ...fromDrafts])]
}

function templateArticle(topic) {
  const city = topic.cityEn
  const cityKo = topic.cityKo
  const companionUrl = withUtm('/companions', {
    source: UTM_SOURCES.blog,
    campaign: topic.slug,
    content: 'cta',
  })

  if (topic.intent === 'companion' && city) {
    return {
      slug: topic.slug,
      publishedAt: todayStr(),
      en: {
        title: `How to find a travel companion in ${city}`,
        excerpt: `Practical steps to meet verified travelers heading to ${city} — dates, vibe, and safety on mytripfy.`,
        readMin: '5 min read',
        metaTitle: `Find a Travel Companion in ${city} | mytripfy`,
        metaDesc: `Looking for a travel buddy in ${city}? Learn how to post or join trips on mytripfy with trust scores, chat, and mutual reviews.`,
        keywords: `travel companion ${city}, travel buddy ${city}, solo travel ${city}, mytripfy`,
        intro: `${city} is easier (and more fun) with the right people. mytripfy helps solo travelers match by destination, dates, and travel style — free.`,
        section1Title: `Clarify your ${city} trip`,
        section1Body: `Write down dates, neighborhood preferences, budget, and pace. A clear post gets better matches than "anyone going to ${city}?"`,
        section2Title: 'Browse open trips or post your own',
        section2Body: `Search companions for ${city}, read host profiles and trust scores, then apply with a short personal note. Or post your own trip and let people come to you.`,
        section3Title: 'Chat and align before you meet',
        section3Body:
          'Use in-app chat to align on lodging, daily rhythm, and split costs. Prefer a public first meetup. Share your plan with someone at home.',
        section4Title: 'Stamp challenges while you explore',
        section4Body: `While in ${city}, complete photo-verified challenges on mytripfy — missions turn sightseeing into a game and give you stories to share.`,
        ctaTitle: `Find companions for ${city}`,
        ctaBody: 'Browse open trips or post yours — completely free.',
        ctaButton: 'Open companions',
        ctaHref: '/companions',
      },
      ko: {
        title: `${cityKo}에서 여행 동행 찾는 법`,
        excerpt: `${cityKo}로 떠나는 여행자와 날짜·스타일로 매칭하는 실전 가이드 — mytripfy 신뢰 점수와 채팅.`,
        readMin: '5분 읽기',
        metaTitle: `${cityKo} 여행 동행 찾기 | mytripfy`,
        metaDesc: `${cityKo} 여행 버디가 필요하신가요? mytripfy에서 동행 게시·신청, 채팅, 상호 리뷰까지 안전하게.`,
        keywords: `${cityKo} 여행 동행, ${cityKo} 솔로 여행, 여행 버디, mytripfy`,
        intro: `${cityKo}는 좋은 사람과 함께면 더 쉽고 즐겁습니다. mytripfy는 목적지·날짜·여행 스타일로 동행을 찾아 드립니다 — 전부 무료.`,
        section1Title: `${cityKo} 일정을 구체적으로`,
        section1Body: `날짜, 선호 동네, 예산, 템포를 적어 두세요. "누구든 ${cityKo}"보다 구체적인 글이 매칭이 잘 됩니다.`,
        section2Title: '열린 여행 보기 또는 직접 올리기',
        section2Body: `${cityKo} 동행을 검색하고 호스트 프로필·신뢰 점수를 확인한 뒤 짧은 신청 메시지를 보내세요. 또는 직접 글을 올리고 신청을 받으세요.`,
        section3Title: '만나기 전 채팅으로 맞추기',
        section3Body:
          '숙소, 하루 리듬, 비용 분담을 앱 채팅으로 맞추세요. 첫 만남은 공공장소가 좋습니다. 일정은 지인에게도 공유하세요.',
        section4Title: '탐험하면서 챌린지 스탬프',
        section4Body: `${cityKo}에서 mytripfy 포토 챌린지를 완료해 보세요. 관광이 게임이 되고, 공유할 스토리가 쌓입니다.`,
        ctaTitle: `${cityKo} 동행 찾기`,
        ctaBody: '열린 여행을 보거나 직접 올려 보세요 — 완전 무료.',
        ctaButton: '동행 보기',
        ctaHref: '/companions',
      },
      utmExample: companionUrl,
    }
  }

  if (topic.intent === 'challenge') {
    return {
      slug: topic.slug,
      publishedAt: todayStr(),
      en: {
        title: 'Solo travel photo challenges that make trips memorable',
        excerpt: 'How 1,600 missions across 100 countries turn sightseeing into stamps, points, and stories.',
        readMin: '6 min read',
        metaTitle: 'Solo Travel Photo Challenges | mytripfy',
        metaDesc: 'Use mytripfy photo-verified challenges to explore deeper, earn Hall of Fame points, and share real stamps.',
        keywords: 'solo travel challenges, travel photo stamp, 100 countries challenge, mytripfy',
        intro: 'Challenges give solo trips a mission. Instead of only checking famous spots, you chase curated experiences — and prove you were there.',
        section1Title: 'What you unlock',
        section1Body:
          'Countries, food, nature, festivals, and more — 16 categories with 100 missions each. Approved stamps earn points toward the Hall of Fame.',
        section2Title: 'How verification works',
        section2Body:
          'Visit, shoot on-site, submit. Community review keeps the feed honest. Disputes have a fair process.',
        section3Title: 'Pair with companions',
        section3Body:
          'Many travelers complete missions together after matching on mytripfy — shared goals make first meetups easier.',
        section4Title: 'Start with one stamp',
        section4Body:
          'Pick one category for your next city. One stamp is enough to feel the loop: explore → prove → share.',
        ctaTitle: 'Browse challenges',
        ctaBody: 'Join free and open your first mission.',
        ctaButton: 'Open challenges',
        ctaHref: '/challenges',
      },
      ko: {
        title: '솔로 여행을 특별하게 만드는 포토 챌린지',
        excerpt: '100개국 1,600개 미션으로 관광을 스탬프·포인트·스토리로 바꾸는 법.',
        readMin: '6분 읽기',
        metaTitle: '솔로 여행 포토 챌린지 | mytripfy',
        metaDesc: 'mytripfy 포토 인증 챌린지로 더 깊게 탐험하고 Hall of Fame 포인트를 쌓으세요.',
        keywords: '솔로 여행 챌린지, 여행 스탬프, 100 countries, mytripfy',
        intro: '챌린지는 솔로 여행에 미션을 줍니다. 유명 스팟만이 아니라 엄선된 경험을 쫓고, 그곳에 있었다는 증거를 남깁니다.',
        section1Title: '무엇을 열 수 있나',
        section1Body:
          '국가·음식·자연·축제 등 16개 카테고리, 각 100개 미션. 승인된 스탬프는 Hall of Fame 포인트가 됩니다.',
        section2Title: '인증 방식',
        section2Body: '방문 → 현장 촬영 → 제출. 커뮤니티 검토로 피드를 지키고, 분쟁은 공정하게 처리합니다.',
        section3Title: '동행과 함께',
        section3Body: 'mytripfy에서 매칭한 뒤 미션을 같이 하는 여행자가 많습니다. 공통 목표가 첫 만남을 쉽게 만듭니다.',
        section4Title: '스탬프 하나로 시작',
        section4Body: '다음 도시에서 카테고리 하나만 고르세요. 탐험 → 인증 → 공유 루프를 느껴 보세요.',
        ctaTitle: '챌린지 둘러보기',
        ctaBody: '무료 가입 후 첫 미션을 열어 보세요.',
        ctaButton: '챌린지 열기',
        ctaHref: '/challenges',
      },
    }
  }

  if (topic.intent === 'guide' && city) {
    return {
      slug: topic.slug,
      publishedAt: todayStr(),
      en: {
        title: `Meet a local guide in ${city}`,
        excerpt: `How to book trusted local experts in ${city} on mytripfy — reviews, rates, and what to ask.`,
        readMin: '5 min read',
        metaTitle: `Local Guides in ${city} | mytripfy`,
        metaDesc: `Find and book local guides in ${city} with trust scores and reviews on mytripfy.`,
        keywords: `${city} local guide, hire guide ${city}, mytripfy guides`,
        intro: `A great local guide turns ${city} from a checklist into a lived-in city. mytripfy connects travelers with guides who have real reviews.`,
        section1Title: 'Search by city and vibe',
        section1Body: `Filter guides covering ${city}. Read languages, hourly rate, and photos before you request.`,
        section2Title: 'Ask the right questions',
        section2Body:
          'Clarify meeting point, duration, transport, food stops, and cancellation rules in chat before you meet.',
        section3Title: 'Trust scores matter',
        section3Body:
          'Mutual reviews build reputation. Prefer complete profiles with email verification and recent activity.',
        section4Title: 'Or become a guide',
        section4Body: `If you know ${city} well, enable guide mode and start receiving requests — free to join.`,
        ctaTitle: `Find guides in ${city}`,
        ctaBody: 'Browse certified local experts with reviews.',
        ctaButton: 'Find a guide',
        ctaHref: '/guides',
      },
      ko: {
        title: `${cityKo} 현지 가이드 만나기`,
        excerpt: `${cityKo}에서 리뷰·요금·질문이 갖춰진 현지 전문가와 연결하는 방법.`,
        readMin: '5분 읽기',
        metaTitle: `${cityKo} 현지 가이드 | mytripfy`,
        metaDesc: `mytripfy에서 ${cityKo} 현지 가이드를 신뢰 점수와 리뷰로 찾아 보세요.`,
        keywords: `${cityKo} 현지 가이드, ${cityKo} 투어 가이드, mytripfy`,
        intro: `좋은 현지 가이드는 ${cityKo}를 체크리스트가 아닌 살아 있는 도시로 만듭니다. mytripfy는 실제 리뷰가 있는 가이드와 연결합니다.`,
        section1Title: '도시·스타일로 검색',
        section1Body: `${cityKo}를 커버하는 가이드를 보고 언어·시급·사진을 확인한 뒤 요청하세요.`,
        section2Title: '미리 확인할 것',
        section2Body: '만남 장소, 시간, 교통, 식사, 취소 규칙을 채팅으로 맞추세요.',
        section3Title: '신뢰 점수',
        section3Body: '상호 리뷰가 평판을 만듭니다. 프로필이 충실하고 최근 활동이 있는 가이드를 우선하세요.',
        section4Title: '가이드로 등록',
        section4Body: `${cityKo}를 잘 안다면 가이드 모드를 켜고 요청을 받아 보세요 — 가입 무료.`,
        ctaTitle: `${cityKo} 가이드 찾기`,
        ctaBody: '리뷰가 있는 현지 전문가를 둘러보세요.',
        ctaButton: '가이드 찾기',
        ctaHref: '/guides',
      },
    }
  }

  // product / trip matcher default
  return {
    slug: topic.slug,
    publishedAt: todayStr(),
    en: {
      title: 'Trip Matcher: find people who travel like you',
      excerpt: 'How the mytripfy quiz helps match companions by destination, dates, and vibe.',
      readMin: '4 min read',
      metaTitle: 'Trip Matcher Quiz Guide | mytripfy',
      metaDesc: 'Use Trip Matcher on mytripfy to meet travelers with compatible dates and travel style.',
      keywords: 'trip matcher, travel personality, find travel buddy, mytripfy',
      intro: 'Great matches start with clarity. Trip Matcher captures where you are going, when, and how you like to travel.',
      section1Title: 'Take the quiz',
      section1Body: 'Answer a short set of questions about destinations, pace, and group size. Your profile becomes searchable.',
      section2Title: 'Get matched suggestions',
      section2Body: 'Browse people and trips that fit your answers instead of scrolling endless unrelated posts.',
      section3Title: 'Message with context',
      section3Body: 'Open chat with shared context already in place — fewer awkward introductions.',
      section4Title: 'Keep improving your profile',
      section4Body: 'Add photos, verify email, and complete your profile for higher trust and better replies.',
      ctaTitle: 'Try Trip Matcher',
      ctaBody: 'Free on mytripfy — start matching in minutes.',
      ctaButton: 'Open Trip Matcher',
      ctaHref: '/personality',
    },
    ko: {
      title: 'Trip Matcher: 나랑 맞는 여행자 찾기',
      excerpt: '목적지·날짜·스타일로 동행을 맞추는 mytripfy 퀴즈 사용법.',
      readMin: '4분 읽기',
      metaTitle: 'Trip Matcher 가이드 | mytripfy',
      metaDesc: 'mytripfy Trip Matcher로 일정과 여행 스타일이 맞는 사람을 만나 보세요.',
      keywords: 'trip matcher, 여행 성향, 여행 동행, mytripfy',
      intro: '좋은 매칭은 명확함에서 시작합니다. Trip Matcher는 어디로, 언제, 어떻게 여행하는지를 담습니다.',
      section1Title: '퀴즈 풀기',
      section1Body: '목적지·템포·인원에 대한 짧은 질문에 답하면 프로필이 검색 가능해집니다.',
      section2Title: '맞는 제안 보기',
      section2Body: '관련 없는 글을 끝없이 스크롤하는 대신, 답변에 맞는 사람과 여행을 봅니다.',
      section3Title: '맥락 있는 메시지',
      section3Body: '공통 맥락이 있는 상태에서 채팅을 시작하니 첫 인사가 덜 어색합니다.',
      section4Title: '프로필을 계속 채우기',
      section4Body: '사진·이메일 인증·완성도를 높이면 신뢰와 답장이 늘어납니다.',
      ctaTitle: 'Trip Matcher 해보기',
      ctaBody: 'mytripfy에서 무료 — 몇 분이면 매칭을 시작할 수 있습니다.',
      ctaButton: 'Trip Matcher 열기',
      ctaHref: '/personality',
    },
  }
}

async function llmPolish(draft) {
  if (!hasLlm()) return draft
  try {
    const raw = await chat(
      'You are a travel SEO copywriter for mytripfy.com. Improve clarity and keywords. Keep JSON keys identical. Return JSON only.',
      JSON.stringify({ en: draft.en, ko: draft.ko }),
      { json: true }
    )
    if (!raw) return draft
    const parsed = JSON.parse(raw)
    return {
      ...draft,
      en: { ...draft.en, ...parsed.en },
      ko: { ...draft.ko, ...parsed.ko },
      llm: true,
    }
  } catch {
    return { ...draft, llm: false, llmError: true }
  }
}

/**
 * @param {{ limit?: number, apply?: boolean }} opts
 */
export async function runBlogRole(opts = {}) {
  const limit = opts.limit ?? 1
  const existing = readExistingSlugs()
  const topics = nextUnpublishedTopics(existing, limit)
  if (topics.length === 0) {
    return { role: 'blog', ok: true, drafts: [], note: 'all queued topics already published or drafted as slugs' }
  }

  const drafts = []
  for (const topic of topics) {
    let draft = templateArticle(topic)
    draft = await llmPolish(draft)
    const file = path.join(OUT_BLOG, `${draft.slug}.json`)
    writeJson(file, draft)
    drafts.push({ slug: draft.slug, file, llm: Boolean(draft.llm) })
  }

  return { role: 'blog', ok: true, drafts, existingCount: existing.length, llm: hasLlm() }
}
