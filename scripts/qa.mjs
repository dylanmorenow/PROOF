// QA sweep: every page at three sizes (console errors, horizontal overflow, screenshot),
// every customer account, tour keyboard control, and a reduced-motion tour run.
// Usage: node scripts/qa.mjs <baseUrl> <outDir>
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const [base = 'http://localhost:5173/', out = 'test-results/qa'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const ROUTES = ['', 'operations?wo=WO-26-0417', 'operations/WO-26-0417', 'evidence?id=EV-3904', 'performance', 'outcome-ledger?run=1', 'nope']
const SIZES = [
  [1440, 900],
  [1024, 768],
  [390, 844],
]
const problems = []
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] })

async function open(path, w, h, opts = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, ...opts })
  const errors = []
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('status of 404') && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.addInitScript(() => sessionStorage.setItem('pip-nudged', '1'))
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  return { page, errors }
}

for (const [w, h] of SIZES) {
  for (const r of ROUTES) {
    const { page, errors } = await open(r, w, h)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    const name = `${w}-${(r || 'overview').replace(/[^a-z0-9]+/gi, '_')}`
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: true })
    if (overflow > 1) problems.push(`${name}: page scrolls sideways by ${overflow}px`)
    if (errors.length) problems.push(`${name}: ${errors.join(' | ')}`)
    await page.close()
  }
}

// Every account renders every page without errors.
{
  const { page, errors } = await open('', 1440, 900)
  for (const name of ['Mahakam Delta Processing', 'Riau Strait Terminals', 'Brantas Coastal Power']) {
    await page.click('[data-tour="header.account"]')
    await page.getByRole('menuitem').filter({ hasText: name }).click()
    for (const r of ['/', '/operations', '/evidence', '/performance']) {
      await page.evaluate((to) => {
        history.pushState({}, '', (document.querySelector('base')?.href ?? '') + to)
        dispatchEvent(new PopStateEvent('popstate'))
      }, (new URL(base).pathname.replace(/\/$/, '') + r))
      await page.waitForTimeout(500)
    }
    const h1 = await page.locator('h1').first().textContent()
    if (!h1) problems.push(`account ${name}: page did not render`)
  }
  if (errors.length) problems.push(`accounts: ${errors.join(' | ')}`)
  await page.close()
}

// Tour keyboard control: arrows move, Escape exits and restores the page.
{
  const { page } = await open('', 1440, 900)
  await page.click('[data-tour="pip"]', { force: true })
  await page.getByRole('menuitem').filter({ hasText: 'Welcome' }).click()
  await page.waitForTimeout(800)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(900)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(900)
  const t1 = await page.locator('#tour-title').last().textContent()
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(900)
  const t2 = await page.locator('#tour-title').last().textContent()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  const left = await page.evaluate(() => ({ overlay: !!document.querySelector('.tour-ring'), flag: document.documentElement.dataset.tour }))
  if (t1 !== 'Active operations' || t2 !== 'Your command center') problems.push(`keyboard: arrows landed on "${t1}" then "${t2}"`)
  if (left.overlay || left.flag) problems.push('keyboard: Escape left the tour overlay behind')
  await page.close()
}

// Reduced motion: the tour still runs and the SVG PIP is used.
{
  const { page, errors } = await open('', 1440, 900, { reducedMotion: 'reduce' })
  await page.click('[data-tour="pip"]', { force: true })
  await page.getByRole('menuitem').filter({ hasText: 'Welcome' }).click()
  for (let i = 0; i < 3; i++) {
    await page.waitForTimeout(700)
    await page.getByRole('button', { name: /Start tour|Next step/ }).click()
  }
  await page.waitForTimeout(700)
  const ok = await page.evaluate(() => getComputedStyle(document.querySelector('.tour-ring')).opacity === '1')
  const canvas = await page.locator('[data-tour="pip"] canvas').count()
  await page.screenshot({ path: `${out}/reduced-motion-tour.png` })
  if (!ok) problems.push('reduced motion: spotlight not shown')
  if (canvas) problems.push('reduced motion: 3D PIP rendered instead of SVG')
  if (errors.length) problems.push(`reduced motion: ${errors.join(' | ')}`)
  await page.close()
}

await browser.close()
console.log(problems.length ? `PROBLEMS (${problems.length})\n- ${problems.join('\n- ')}` : 'QA: no problems found')
