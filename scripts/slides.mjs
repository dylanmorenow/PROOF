// Presentation screenshots at 1920×1080 (and one phone shot) into docs/screenshots.
// Usage: node scripts/slides.mjs [baseUrl]
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:5173/'
const out = 'docs/screenshots'
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] })

async function shot(name, path, { w = 1920, h = 1080, dpr = 1, before, landing } = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })
  await page.addInitScript(() => sessionStorage.setItem('pip-nudged', '1'))
  if (!landing) await page.addInitScript(() => sessionStorage.setItem('proof-signed-in', '1'))
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2200)
  if (before) await before(page)
  await page.screenshot({ path: `${out}/${name}.png` })
  await page.close()
  console.log('saved', name)
}

/** Start the current page's tour from PIP and advance to step `n` (1 = first step). */
const tour = (n) => async (page) => {
  await page.click('[data-tour="pip"]', { force: true })
  for (let i = 1; i < n; i++) {
    await page.waitForTimeout(1300)
    await page.getByRole('button', { name: /Next step/ }).click()
  }
  await page.waitForTimeout(1600)
}

await shot('00-sign-in', '', { landing: true, before: (p) => p.waitForTimeout(2500) })
await shot('00-sign-in-phone', '', { landing: true, w: 390, h: 844, dpr: 3, before: (p) => p.waitForTimeout(2500) })
await shot('01-overview', '')
await shot('02-strategy-lens', '', { before: async (p) => (await p.keyboard.press('l'), p.waitForTimeout(500)) })
await shot('03-tour-welcome', '', { before: tour(3) })
await shot('04-regional-network', '', {
  before: async (p) => {
    await p.click('[data-tour="map.node.balikpapan"]')
    await p.hover('[data-tour="map.node.balikpapan"]')
    await p.waitForTimeout(600)
  },
})
await shot('05-operations', 'operations?wo=WO-26-0417')
await shot('06-service-detail', 'operations/WO-26-0417')
await shot('07-tour-service', 'operations', { before: tour(6) })
await shot('08-evidence', 'evidence?id=EV-3904')
await shot('09-performance', 'performance')
await shot('10-report', 'performance', { before: async (p) => (await p.getByRole('button', { name: 'Export report' }).click(), p.waitForTimeout(600)) })
await shot('11-outcome-ledger', 'outcome-ledger?run=1')
await shot('12-tour-ledger', 'outcome-ledger', { before: tour(5) })
await shot('13-phone-overview', '', { w: 390, h: 844, dpr: 3 })
await shot('14-phone-tour', '', { w: 390, h: 844, dpr: 3, before: tour(3) })

await browser.close()
