const { chromium } = require('playwright')
const sharp = require('sharp')
const path = require('path')

const BASE = 'https://www.mytripfy.com'

/** 가로:세로 = 16:9 (가로형) → height = width × 9/16 */
function size16by9(width) {
  return Math.round((width * 9) / 16)
}

/** 가로:세로 = 9:16 (세로형) → height = width × 16/9 */
function size9by16(width) {
  return Math.round((width * 16) / 9)
}

const CONFIGS = [
  {
    id: '7in',
    prefix: 'tablet-7in',
    width: 320,
    aspect: '9:16',
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  {
    id: '10in',
    prefix: 'tablet-10in',
    width: 1080,
    aspect: '9:16',
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-X900) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
]

const PAGES = [
  { slug: '01-home', path: '/en' },
  { slug: '02-companions', path: '/en/companions' },
  { slug: '03-guides', path: '/en/guides' },
  { slug: '04-challenges', path: '/en/challenges' },
  { slug: '05-sponsors', path: '/en/sponsors' },
]

;(async () => {
  const publicDir = path.join(__dirname, '..', 'public')

  for (const cfg of CONFIGS) {
    const outW = cfg.width
    const outH =
      cfg.aspect === '9:16' ? size9by16(outW) : size16by9(outW)
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      viewport: { width: outW, height: outH },
      deviceScaleFactor: 1,
      userAgent: cfg.userAgent,
    })

    for (const { slug, path: p } of PAGES) {
      const page = await context.newPage()
      const url = `${BASE}${p}`
      try {
        const res = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 90000,
        })
        if (!res || !res.ok()) {
          console.warn('non-ok', url, res?.status())
        }
        await page.waitForSelector('header', { timeout: 25000 }).catch(() => {})
        await page.evaluate(() => window.scrollTo(0, 0))
        await new Promise((r) => setTimeout(r, 2000))
        const png = await page.screenshot({ type: 'png', fullPage: false })
        const out = path.join(publicDir, `${cfg.prefix}-${slug}.jpg`)
        await sharp(png)
          .resize(outW, outH, { fit: 'cover', position: 'top' })
          .jpeg({ quality: 90, mozjpeg: true })
          .toFile(out)
        const meta = await sharp(out).metadata()
        console.log('saved', path.basename(out), `${meta.width}x${meta.height}`)
      } catch (e) {
        console.error('failed', url, e.message)
      } finally {
        await page.close()
      }
    }

    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
