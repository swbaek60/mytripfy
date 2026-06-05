#!/usr/bin/env node
/** Day 1 고정 게시용 캡션·프롬프트 생성 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  AI_DISCLOSURE,
  ACCOUNTS,
  BRAND,
  buildSuaImagePrompts,
  buildEthanImagePrompts,
  getSuaCountry,
  getEthanCountry,
  getSuaOutfit,
  getEthanOutfit,
} from './lib/sns-campaign-config.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'out', 'pinned')

function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

  const suaCountry = getSuaCountry(1)
  const ethanCountry = getEthanCountry(1)
  const suaOutfit = getSuaOutfit(1)
  const ethanOutfit = getEthanOutfit(1)

  const suaIntro =
    AI_DISCLOSURE.pinnedCaptionKo +
    '\n\n🇰🇷 한국에서 100개국 챌린지 시작!\n' +
    BRAND.hashtags +
    ' #한국 1/100'

  const ethanIntro =
    AI_DISCLOSURE.pinnedCaptionEn +
    '\n\n🇺🇸 Starting from the US — Day 1/100!\n' +
    BRAND.hashtags +
    ' #USA 1/100'

  fs.writeFileSync(path.join(OUT, 'sua-pinned-caption.txt'), suaIntro, 'utf8')
  fs.writeFileSync(path.join(OUT, 'ethan-pinned-caption.txt'), ethanIntro, 'utf8')

  const suaPrompts = buildSuaImagePrompts(1, suaCountry, suaOutfit)
  const ethanPrompts = buildEthanImagePrompts(1, ethanCountry, ethanOutfit)
  fs.writeFileSync(
    path.join(OUT, 'sua-pinned-prompts.txt'),
    suaPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n'),
    'utf8'
  )
  fs.writeFileSync(
    path.join(OUT, 'ethan-pinned-prompts.txt'),
    ethanPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n'),
    'utf8'
  )

  const profile = `수아 @${ACCOUNTS.sua.handle}
${AI_DISCLOSURE.profileKo}
링크: ${BRAND.siteUrlUtmSua}

이든 @${ACCOUNTS.ethan.handle}
${AI_DISCLOSURE.profileEn}
링크: ${BRAND.siteUrlUtmEthan}
`
  fs.writeFileSync(path.join(OUT, 'profile-bios.txt'), profile, 'utf8')
  console.log('저장됨:', OUT)
}

main()
