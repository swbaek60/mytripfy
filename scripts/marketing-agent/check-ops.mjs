#!/usr/bin/env node
/**
 * Marketing / SNS ops checklist (read-only status)
 *   node scripts/marketing-agent/check-ops.mjs
 */
import './lib/load-env.mjs'
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { getEnv } from '../lib/sns-env.mjs'
import { ROOT } from './lib/paths.mjs'
import { hasLlm } from './lib/llm.mjs'

const rows = []

function check(name, ok, hint = '') {
  rows.push({ name, ok: Boolean(ok), hint })
  console.log(`${ok ? '[OK] ' : '[!!] '} ${name}${hint ? ` — ${hint}` : ''}`)
}

check('OPENAI or GEMINI (LLM copy)', hasLlm(), hasLlm() ? '' : 'text templates still work; set OPENAI_API_KEY or GEMINI_API_KEY for polish')
check('META_ACCESS_TOKEN', getEnv('META_ACCESS_TOKEN'), 'needed for IG publish')
check('INSTAGRAM_SUA_USER_ID', getEnv('INSTAGRAM_SUA_USER_ID'))
check('INSTAGRAM_ETHAN_USER_ID', getEnv('INSTAGRAM_ETHAN_USER_ID'))
check('SNS_IMAGE_BASE_URL', getEnv('SNS_IMAGE_BASE_URL'), 'public URL for Meta media')
check('SNS_AUTO_PUBLISH', getEnv('SNS_AUTO_PUBLISH') === 'true', `current=${getEnv('SNS_AUTO_PUBLISH', 'false')}`)
check(
  'Images mode',
  getEnv('SNS_USE_MANUAL_IMAGES') === 'true' || getEnv('SNS_SKIP_IMAGES') === 'true' || getEnv('OPENAI_API_KEY') || getEnv('GEMINI_API_KEY'),
  getEnv('SNS_USE_MANUAL_IMAGES') === 'true'
    ? 'manual Cursor Generate'
    : getEnv('SNS_SKIP_IMAGES') === 'true'
      ? 'skip images'
      : 'API images if key present'
)

const bat = path.join(ROOT, 'scripts', 'run-sns-auto.bat')
check('run-sns-auto.bat exists', fs.existsSync(bat))

const mBat = path.join(ROOT, 'scripts', 'run-marketing-daily.bat')
check('run-marketing-daily.bat exists', fs.existsSync(mBat), fs.existsSync(mBat) ? '' : 'will be created with install')

if (process.platform === 'win32') {
  const r = spawnSync('powershell', ['-NoProfile', '-Command', "Get-ScheduledTask -TaskName 'MyTripfy-SNS-Daily' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty State"], {
    encoding: 'utf8',
  })
  const state = (r.stdout || '').trim()
  check('Windows task MyTripfy-SNS-Daily', state === 'Ready', state ? `state=${state}` : 'not registered — npm run sns:install-task')

  const r2 = spawnSync('powershell', ['-NoProfile', '-Command', "Get-ScheduledTask -TaskName 'MyTripfy-Marketing-Daily' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty State"], {
    encoding: 'utf8',
  })
  const state2 = (r2.stdout || '').trim()
  check('Windows task MyTripfy-Marketing-Daily', state2 === 'Ready', state2 ? `state=${state2}` : 'not registered — npm run marketing:install-task')
}

const failed = rows.filter((r) => !r.ok)
console.log(`\n${rows.length - failed.length}/${rows.length} checks passed`)
if (failed.length) {
  console.log('Action items:')
  for (const f of failed) console.log(`  - ${f.name}: ${f.hint || 'fix'}`)
  process.exitCode = 1
}
