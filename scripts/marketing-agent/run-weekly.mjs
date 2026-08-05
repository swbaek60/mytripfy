#!/usr/bin/env node
/**
 * Marketing AI — weekly run (blog + community drafts)
 *   node scripts/marketing-agent/run-weekly.mjs
 *   node scripts/marketing-agent/run-weekly.mjs --blog-limit=2 --community=3
 */
import './lib/load-env.mjs'
import { runBlogRole } from './roles/blog.mjs'
import { runCommunityRole } from './roles/community.mjs'
import { runReportRole } from './roles/report.mjs'

function argNum(name, fallback) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`))
  if (!a) return fallback
  const n = Number(a.split('=')[1])
  return Number.isFinite(n) ? n : fallback
}

async function main() {
  const results = []
  results.push(await runBlogRole({ limit: argNum('blog-limit', 1) }))
  results.push(await runCommunityRole({ count: argNum('community', 3) }))
  results.push(await runReportRole(results))

  console.log('\n=== marketing weekly summary ===')
  for (const r of results) {
    console.log(`- ${r.role}: ${r.ok === false ? 'FAIL' : 'ok'}`, r.drafts ? `(${r.drafts.length} drafts)` : '')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
