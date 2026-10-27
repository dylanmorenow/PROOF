// Full-resolution screenshots for visual QA and presentation slides.
// Usage: node scripts/shoot.mjs <url> <out.png> [width] [height] [--full] [--wait=ms] [--scroll=y] [--dpr=1] [--landing]
import { chromium } from '@playwright/test'

const [url, out, w = '1440', h = '900', ...flags] = process.argv.slice(2)
const flag = (name) => flags.find((f) => f.startsWith(`--${name}`))?.split('=')[1]

const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(flag('dpr') ?? 1) })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
if (!flags.includes('--landing')) await page.addInitScript(() => sessionStorage.setItem('proof-signed-in', '1'))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(+(flag('wait') ?? 2200))
if (flag('scroll')) {
  await page.evaluate((y) => window.scrollTo(0, y), +flag('scroll'))
  await page.waitForTimeout(600)
}
await page.screenshot({ path: out, fullPage: flags.includes('--full') })
if (errors.length) console.log('console errors:\n' + errors.join('\n'))
await browser.close()
console.log('saved', out)
