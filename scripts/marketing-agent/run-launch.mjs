#!/usr/bin/env node
/**
 * Marketing AI — launch pack (once / monthly refresh)
 *   node scripts/marketing-agent/run-launch.mjs
 */
import './lib/load-env.mjs'
import { runLaunchRole } from './roles/launch.mjs'
import { runReportRole } from './roles/report.mjs'

async function main() {
  const launch = await runLaunchRole()
  await runReportRole([launch])
  console.log('Launch pack written to', launch.dir)
  console.log(launch.files.join(', '))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
