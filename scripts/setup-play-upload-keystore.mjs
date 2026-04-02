/**
 * Play 업로드용 PKCS12 키 + android/keystore.properties 를 한 번에 생성 (비대화형)
 * 비밀번호는 환경변수 MYTRIPFY_KEYSTORE_PASSWORD 로 넘기거나, 스크립트가 임의 생성 후 출력
 *
 * 사용: node scripts/setup-play-upload-keystore.mjs
 */
import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import crypto from 'node:crypto'

const androidDir = join(process.cwd(), 'android')
const jksPath = join(androidDir, 'mytripfy-upload.jks')
const propsPath = join(androidDir, 'keystore.properties')

function findKeytool() {
  const win = process.platform === 'win32'
  const candidates = []
  if (process.env.JAVA_HOME) {
    candidates.push(join(process.env.JAVA_HOME, 'bin', win ? 'keytool.exe' : 'keytool'))
  }
  if (win) {
    const la = process.env.LOCALAPPDATA || ''
    candidates.push('C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\keytool.exe')
    candidates.push(join(la, 'Programs', 'Android', 'Android Studio', 'jbr', 'bin', 'keytool.exe'))
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool')
  }
  for (const p of candidates) {
    if (p && existsSync(p)) return p
  }
  return null
}

if (existsSync(jksPath)) {
  console.error('[setup-keystore] android/mytripfy-upload.jks 가 이미 있습니다. 삭제 후 다시 실행하거나 수동으로 keystore.properties 만 만드세요.')
  process.exit(1)
}

const keytool = findKeytool()
if (!keytool) {
  console.error(
    '[setup-keystore] keytool 을 찾을 수 없습니다. Android Studio 설치 또는 JAVA_HOME 설정 후 다시 실행하세요.'
  )
  process.exit(1)
}

// properties 파일 안전을 위해 = # 공백 없는 문자열만
const password =
  process.env.MYTRIPFY_KEYSTORE_PASSWORD || crypto.randomBytes(18).toString('base64url')

const dname =
  process.env.MYTRIPFY_KEYSTORE_DNAME ||
  'CN=MyTripfy Upload, OU=Mobile, O=mytripfy, L=Seoul, ST=Seoul, C=KR'

const r = spawnSync(
  keytool,
  [
    '-genkeypair',
    '-v',
    '-storetype',
    'PKCS12',
    '-keystore',
    jksPath,
    '-alias',
    'mytripfy',
    '-keyalg',
    'RSA',
    '-keysize',
    '2048',
    '-validity',
    '10000',
    '-storepass',
    password,
    '-keypass',
    password,
    '-dname',
    dname,
  ],
  { stdio: 'inherit' }
)

if (r.status !== 0) {
  process.exit(r.status ?? 1)
}

const props = `storePassword=${password}
keyPassword=${password}
keyAlias=mytripfy
storeFile=mytripfy-upload.jks
`
writeFileSync(propsPath, props, 'utf8')

console.log('\n[setup-keystore] 완료: android/mytripfy-upload.jks, android/keystore.properties')
if (!process.env.MYTRIPFY_KEYSTORE_PASSWORD) {
  console.log('\n=== 이 비밀번호를 반드시 비밀번호 관리자에 저장하세요 (분실 시 복구 불가) ===')
  console.log(password)
  console.log('================================================================\n')
}
