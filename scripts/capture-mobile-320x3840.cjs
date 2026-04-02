const { chromium } = require('playwright')
const sharp = require('sharp')
const path = require('path')

const BASE = 'https://www.mytripfy.com'
/** 가로 320px, 비율 9:16 (가로:세로) → 세로 = 320 × (16/9) */
const OUT_W = 320
const OUT_H = Math.round((OUT_W * 16) / 9)
const VIEWPORT = { width: OUT_W, height: OUT_H }

const PAGES = [
  { slug: '01-home', path: '/en' },
  { slug: '02-companions', path: '/en/companions' },
  { slug: '03-guides', path: '/en/guides' },
  { slug: '04-challenges', path: '/en/challenges' },
  { slug: '05-sponsors', path: '/en/sponsors' },
]

;(async () => {
  const publicDir = path.join(__dirname, '..', 'public')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
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
      const out = path.join(publicDir, `mobile-screen-${slug}.jpg`)
      await sharp(png)
        .resize(OUT_W, OUT_H, { fit: 'cover', position: 'top' })
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(out)
      const meta = await sharp(out).metadata()
      console.log('saved', out, `${meta.width}x${meta.height}`)
    } catch (e) {
      console.error('failed', url, e.message)
    } finally {
      await page.close()
    }
  }

  await browser.close()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
