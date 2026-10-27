// Runs a guided tour in a real browser, screenshots every step and checks spotlight accuracy.
// Usage: node scripts/tour-check.mjs <baseUrl> <outDir> [tour=A] [width=1440] [height=900] [--scroll=y]
// Tours: A Overview, B Operations, C Outcome Ledger, D Evidence, E Performance, F Service Detail.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const [base = 'http://localhost:5173/', out = 'test-results/tour', letter = 'A', w = '1440', h = '900', ...flags] = process.argv.slice(2)
const scroll = flags.find((f) => f.startsWith('--scroll='))?.split('=')[1]
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.addInitScript(() => sessionStorage.setItem('proof-signed-in', '1'))
const PAGE = { A: '', B: 'operations', C: 'outcome-ledger', D: 'evidence', E: 'performance', F: 'operations/WO-26-0417' }[letter]
await page.goto(base + PAGE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
if (scroll) await page.evaluate((y) => window.scrollTo(0, y), +scroll)

await page.click('[data-tour="pip"]', { force: true })

let failures = 0
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(1500)
  const info = await page.evaluate(() => {
    const ring = document.querySelector('.tour-ring')
    const card = document.querySelector('[role="dialog"][aria-labelledby="tour-title"]')
    const title = document.getElementById('tour-title')?.textContent
    const step = ''
    const r = ring?.getBoundingClientRect()
    const c = card?.getBoundingClientRect()
    const visible = ring && getComputedStyle(ring).opacity !== '0'
    return { title, step, ring: visible && r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null, card: c ? { x: c.x, y: c.y, w: c.width, h: c.height } : null, vw: document.documentElement.clientWidth, vh: innerHeight }
  })
  const n = String(i + 1).padStart(2, '0')
  await page.screenshot({ path: `${out}/step-${n}.png` })
  const cardOk = info.card && info.card.x >= 0 && info.card.y >= 0 && info.card.x + info.card.w <= info.vw + 1 && info.card.y + info.card.h <= info.vh + 1
  let ringOk = true
  if (info.ring) {
    // The ring must enclose a [data-tour] element with ~8px padding.
    ringOk = await page.evaluate((ring) => {
      return [...document.querySelectorAll('[data-tour]')].some((el) => {
        const r = el.getBoundingClientRect()
        if (r.width <= 2) return false
        // Expected ring: rect + 8px padding, clamped 3px inside the viewport.
        const vw = document.documentElement.clientWidth, vh = innerHeight
        const x0 = Math.max(3, r.x - 8), y0 = Math.max(3, r.y - 8), x1 = Math.min(vw - 3, r.right + 8), y1 = Math.min(vh - 3, r.bottom + 8)
        const near = (a, b) => Math.abs(a - b) < 3
        const exact = near(r.x - 8, ring.x) && near(r.y - 8, ring.y) && near(r.width + 16, ring.w) && near(r.height + 16, ring.h)
        const clamped = near(x0, ring.x) && near(y0, ring.y) && near(x1 - x0, ring.w) && near(y1 - y0, ring.h)
        return exact || clamped
      })
    }, info.ring)
  }
  if (!cardOk || !ringOk) failures++
  console.log(`${n} ${info.step} | ${info.title} | ring ${info.ring ? `${Math.round(info.ring.x)},${Math.round(info.ring.y)} ${Math.round(info.ring.w)}x${Math.round(info.ring.h)}` : 'none'} | card ${cardOk ? 'ok' : 'OFFSCREEN'} | spotlight ${ringOk ? 'ok' : 'MISMATCH'}`)
  const finish = page.getByRole('button', { name: 'Finish tour' })
  if (await finish.count()) {
    await finish.click()
    break
  }
  await page.getByRole('button', { name: /Next step/ }).click()
}
await page.waitForTimeout(900)
await page.screenshot({ path: `${out}/after.png` })
const leftover = await page.evaluate(() => ({ overlay: !!document.querySelector('.tour-ring'), flag: document.documentElement.dataset.tour ?? null }))
console.log('after tour:', JSON.stringify(leftover))
if (errors.length) console.log('console errors:\n' + errors.join('\n'))
console.log(failures ? `FAILURES: ${failures}` : 'ALL STEPS OK')
await browser.close()
