/**
 * public/mytripfy-logo.png(또는 logo-transparent.png) 기준으로
 * 웹 파비콘·PWA·OG 이미지 + Android mipmap 런처 아이콘 생성
 */
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs'
import { join } from 'path'

const publicDir = join(process.cwd(), 'public')
const appDir = join(process.cwd(), 'src/app')
const androidRes = join(process.cwd(), 'android/app/src/main/res')

const primary = join(publicDir, 'mytripfy-logo.png')
const fallback = join(publicDir, 'logo-transparent.png')
const src = existsSync(primary) ? primary : fallback

if (!existsSync(src)) {
  console.error(
    '소스 이미지가 없습니다. public/mytripfy-logo.png 또는 public/logo-transparent.png 를 두세요.'
  )
  process.exit(1)
}

const white = { r: 255, g: 255, b: 255, alpha: 1 }
const themeBlue = { r: 29, g: 78, b: 216, alpha: 1 }

const meta = await sharp(src).metadata()
const W = meta.width ?? 512
const H = meta.height ?? 512
/** 상단 그래픽 마크만 (파비콘·앱 아이콘 심볼용) — 글자 제외 */
const markTopRatio = 0.5
const markHeight = Math.max(1, Math.round(H * markTopRatio))

function markPipeline() {
  return sharp(src)
    .extract({ left: 0, top: 0, width: W, height: markHeight })
    .png()
}

/** 정사각 캔버스 가운데에 이미지 맞춤 */
async function fitOnSquare(input, size, background) {
  const buf = Buffer.isBuffer(input) ? input : await sharp(input).png().toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([
      {
        input: await sharp(buf)
          .resize(size, size, { fit: 'contain', background })
          .png()
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
}

/** Adaptive foreground: 흰 배경, 안전영역(~72/108) 안에 마크 */
async function adaptiveForeground(px) {
  const inner = Math.floor((px * 72) / 108)
  const markBuf = await markPipeline()
    .resize(inner, inner, { fit: 'contain', background: white })
    .png()
    .toBuffer()
  return sharp({
    create: { width: px, height: px, channels: 4, background: white },
  })
    .composite([{ input: markBuf, gravity: 'center' }])
    .png()
}

/** 레거시 런처: 마크 중심 (작은 dp에서도 식별 가능) */
async function legacyLauncher(px) {
  const inner = Math.floor(px * 0.62)
  const markBuf = await markPipeline()
    .resize(inner, inner, { fit: 'contain', background: white })
    .png()
    .toBuffer()
  return sharp({
    create: { width: px, height: px, channels: 4, background: white },
  })
    .composite([{ input: markBuf, gravity: 'center' }])
    .png()
}

// --- Web: 파비콘 (마크만) ---
const fav16 = join(publicDir, 'favicon-16x16.png')
const fav32 = join(publicDir, 'favicon-32x32.png')
await (await fitOnSquare(await markPipeline().toBuffer(), 16, white)).toFile(fav16)
await (await fitOnSquare(await markPipeline().toBuffer(), 32, white)).toFile(fav32)
const icoBuf = await pngToIco([fav16, fav32])
writeFileSync(join(publicDir, 'favicon.ico'), icoBuf)

// Next.js App Router: 북마크/탭이 안정적으로 /favicon.ico 를 쓰도록 src/app 에도 배치
mkdirSync(appDir, { recursive: true })
writeFileSync(join(appDir, 'favicon.ico'), icoBuf)
copyFileSync(fav32, join(appDir, 'icon.png'))

// Apple + PWA (전체 로고)
const applePath = join(publicDir, 'apple-icon.png')
await sharp(src)
  .resize(180, 180, { fit: 'contain', background: white })
  .png()
  .toFile(applePath)
copyFileSync(applePath, join(appDir, 'apple-icon.png'))

for (const size of [192, 512]) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: white })
    .png()
    .toFile(join(publicDir, `icon-${size}.png`))
}

// OG (브랜드 블루 배경 + 전체 로고)
const OG_W = 1200
const OG_H = 630
const logoForOg = await sharp(src)
  .resize(560, 220, { fit: 'contain', background: themeBlue })
  .png()
  .toBuffer()
await sharp({
  create: {
    width: OG_W,
    height: OG_H,
    channels: 4,
    background: themeBlue,
  },
})
  .composite([{ input: logoForOg, gravity: 'center' }])
  .png()
  .toFile(join(publicDir, 'og-image.png'))

// --- Android mipmaps ---
const densities = [
  { name: 'mipmap-mdpi', adaptive: 108, legacy: 48 },
  { name: 'mipmap-hdpi', adaptive: 162, legacy: 72 },
  { name: 'mipmap-xhdpi', adaptive: 216, legacy: 96 },
  { name: 'mipmap-xxhdpi', adaptive: 324, legacy: 144 },
  { name: 'mipmap-xxxhdpi', adaptive: 432, legacy: 192 },
]

for (const { name, adaptive, legacy } of densities) {
  const dir = join(androidRes, name)
  mkdirSync(dir, { recursive: true })
  await (await adaptiveForeground(adaptive)).toFile(join(dir, 'ic_launcher_foreground.png'))
  await (await legacyLauncher(legacy)).toFile(join(dir, 'ic_launcher.png'))
  await (await legacyLauncher(legacy)).toFile(join(dir, 'ic_launcher_round.png'))
}

console.log(
  'OK: public favicon*, src/app/favicon.ico+icon.png+apple-icon.png, icon-192/512, og-image, android mipmaps'
)
console.log('소스:', src)
