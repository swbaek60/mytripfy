/**
 * IG Editor role — delegates to existing sns-auto-daily pipeline
 */
import { spawn } from 'child_process'
import path from 'path'
import { SCRIPTS, ROOT } from '../lib/paths.mjs'
import { getEnv } from '../../lib/sns-env.mjs'

function runNode(scriptRel, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(SCRIPTS, scriptRel), ...args], {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    })
    child.on('close', (code) => {
      if (code === 0) resolve({ ok: true })
      else reject(new Error(`${scriptRel} exited ${code}`))
    })
  })
}

/**
 * @param {{ publish?: boolean, noImages?: boolean }} opts
 */
export async function runIgRole(opts = {}) {
  const args = []
  const publish =
    opts.publish === true ||
    getEnv('SNS_AUTO_PUBLISH', 'false') === 'true' ||
    process.argv.includes('--publish')
  const noImages =
    opts.noImages === true ||
    getEnv('SNS_SKIP_IMAGES', 'false') === 'true' ||
    getEnv('SNS_USE_MANUAL_IMAGES', 'false') === 'true' ||
    process.argv.includes('--no-images')

  if (publish) args.push('--publish')
  if (noImages) args.push('--no-images')

  const hasMeta =
    Boolean(getEnv('META_ACCESS_TOKEN')) && Boolean(getEnv('INSTAGRAM_SUA_USER_ID'))

  try {
    await runNode('sns-auto-daily.mjs', args)
    return {
      role: 'ig',
      ok: true,
      publish,
      noImages,
      hasMeta,
      note: publish && !hasMeta ? 'publish requested but Meta secrets missing' : 'sns-auto-daily completed',
    }
  } catch (e) {
    return {
      role: 'ig',
      ok: false,
      publish,
      noImages,
      hasMeta,
      error: e.message,
    }
  }
}
