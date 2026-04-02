/**
 * OS에 맞게 android/gradlew 로 bundleRelease 실행
 * JAVA_HOME 미설정 시 Android Studio 번들 JBR 경로를 시도(Windows/macOS)
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

function resolveJavaHome() {
  if (process.env.JAVA_HOME && existsSync(join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))) {
    return process.env.JAVA_HOME
  }
  const candidates = []
  if (process.platform === 'win32') {
    const la = process.env.LOCALAPPDATA || ''
    candidates.push(
      'C:\\Program Files\\Android\\Android Studio\\jbr',
      join(la, 'Programs', 'Android', 'Android Studio', 'jbr'),
    )
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Android Studio.app/Contents/jbr')
  }
  for (const dir of candidates) {
    const java = join(dir, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
    if (existsSync(java)) return dir
  }
  return null
}

const androidDir = join(process.cwd(), 'android')
const win = process.platform === 'win32'
const gradlew = join(androidDir, win ? 'gradlew.bat' : 'gradlew')

const javaHome = resolveJavaHome()
const env = { ...process.env }
if (javaHome && !process.env.JAVA_HOME) {
  env.JAVA_HOME = javaHome
  console.error(`[android:bundle] JAVA_HOME not set; using: ${javaHome}`)
}

const r = spawnSync(gradlew, ['bundleRelease'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: win,
  env,
})

process.exit(r.status ?? 1)
