#!/usr/bin/env node
/**
 * Marketing AI — daily run (growth-first: short-form hooks + optional IG)
 *   node scripts/marketing-agent/run-daily.mjs
 *   node scripts/marketing-agent/run-daily.mjs --skip-ig
 *   node scripts/marketing-agent/run-daily.mjs --hooks=12
 */
import './lib/load-env.mjs'
import { runIgRole } from './roles/ig.mjs'
import { runShortsRole } from './roles/shorts.mjs'
import { runReportRole } from './roles/report.mjs'

function hasFlag(f) {
  return process.argv.includes(f)
}

function argNum(name, fallback) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`))
  if (!a) return fallback
  const n = Number(a.split('=')[1])
  return Number.isFinite(n) ? n : fallback
}

async function main() {
  const results = []

  // Priority #1: short-form pain hooks (TikTok / Reels / Shorts scripts)
  results.push(await runShortsRole({ count: argNum('hooks', 12) }))

  if (!hasFlag('--skip-ig')) {
    results.push(
      await runIgRole({
        publish: hasFlag('--publish'),
        noImages: hasFlag('--no-images'),
      })
    )
  } else {
    results.push({ role: 'ig', ok: true, note: 'skipped' })
  }

  const report = await runReportRole(results)
  results.push(report)

  const failed = results.filter((r) => r.ok === false)
  console.log('\n=== marketing daily summary ===')
  for (const r of results) {
    console.log(
      `- ${r.role}: ${r.ok === false ? 'FAIL' : 'ok'}${r.index ? ` → ${r.index}` : ''}${r.file ? ` → ${r.file}` : ''}${r.count != null ? ` (${r.count} hooks)` : ''}${r.note ? ` (${r.note})` : ''}`
    )
  }
  if (failed.length) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
