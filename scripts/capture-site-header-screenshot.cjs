const { chromium } = require('playwright')
const path = require('path')

;(async () => {
  const out = path.join(__dirname, '..', 'public', 'site-header-1024x500.jpg')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1024, height: 500 })
  await page.goto('https://www.mytripfy.com/en', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForSelector('header', { timeout: 30000 })
  await new Promise((r) => setTimeout(r, 2000))
  await page.screenshot({ path: out, type: 'jpeg', quality: 92 })
  await browser.close()
  console.log('saved', out)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
