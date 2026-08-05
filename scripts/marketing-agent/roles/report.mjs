/**
 * Ops Reporter — daily marketing run summary
 */
import path from 'path'
import { OUT_REPORTS } from '../lib/paths.mjs'
import { writeJson, writeText, todayStr } from '../lib/write-out.mjs'
import { getEnv } from '../../lib/sns-env.mjs'
import { hasLlm } from '../lib/llm.mjs'

/**
 * @param {object[]} results role results
 */
export async function runReportRole(results = []) {
  const date = todayStr()
  const checklist = {
    metaToken: Boolean(getEnv('META_ACCESS_TOKEN')),
    igSua: Boolean(getEnv('INSTAGRAM_SUA_USER_ID')),
    igEthan: Boolean(getEnv('INSTAGRAM_ETHAN_USER_ID')),
    imageBaseUrl: Boolean(getEnv('SNS_IMAGE_BASE_URL')),
    autoPublish: getEnv('SNS_AUTO_PUBLISH', 'false') === 'true',
    skipImages: getEnv('SNS_SKIP_IMAGES', 'false') === 'true' || getEnv('SNS_USE_MANUAL_IMAGES', 'false') === 'true',
    llm: hasLlm(),
  }

  const report = {
    date,
    checklist,
    results,
    weeklyMetricsTemplate: {
      note: 'Fill manually each week (free tools)',
      igFollowersSua: null,
      igFollowersEthan: null,
      igReach: null,
      siteSessions: null,
      blogPageviews: null,
      companionPostsBeachhead: null,
      signups: null,
      utmTopSources: ['instagram', 'blog', 'reddit', 'producthunt', 'directory'],
    },
  }

  const jsonPath = path.join(OUT_REPORTS, `${date}.json`)
  const mdPath = path.join(OUT_REPORTS, `${date}.md`)
  writeJson(jsonPath, report)

  const lines = [
    `# Marketing report — ${date}`,
    '',
    '## Ops checklist',
    `- Meta token: ${checklist.metaToken ? 'yes' : 'NO'}`,
    `- IG Sua ID: ${checklist.igSua ? 'yes' : 'NO'}`,
    `- IG Ethan ID: ${checklist.igEthan ? 'yes' : 'NO'}`,
    `- SNS_IMAGE_BASE_URL: ${checklist.imageBaseUrl ? 'yes' : 'NO'}`,
    `- SNS_AUTO_PUBLISH: ${checklist.autoPublish}`,
    `- Manual/skip images: ${checklist.skipImages}`,
    `- LLM available: ${checklist.llm}`,
    '',
    '## Role results',
    ...results.map((r) => `- **${r.role}**: ${r.ok ? 'ok' : 'FAIL'} ${r.note || r.error || JSON.stringify(r.drafts?.length ?? '')}`),
    '',
    '## This week (fill in)',
    '- [ ] IG insights (reach, follows)',
    '- [ ] Search Console / analytics UTM',
    '- [ ] Community queue posted?',
    '- [ ] Directory / PH submissions',
    '',
  ]
  writeText(mdPath, lines.join('\n'))

  return { role: 'report', ok: true, file: mdPath, checklist }
}
