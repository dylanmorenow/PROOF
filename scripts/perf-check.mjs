import { chromium } from '@playwright/test'
const gpu = process.argv[2] === 'gpu'
const url = process.argv[3] ?? 'http://localhost:5173/'
const browser = await chromium.launch({ args: gpu ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] : [] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
const fps = () => page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; performance.now() - t0 < 1000 ? requestAnimationFrame(f) : r(n) }; requestAnimationFrame(f) }))
console.log('renderer', await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl'); const d = c?.getExtension('WEBGL_debug_renderer_info'); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a' }))
console.log('idle fps', await fps())
await page.click('[data-tour="pip"]', { force: true })
await page.waitForTimeout(300)
await page.getByRole('menuitem').first().click()
await page.waitForTimeout(1500)
console.log('tour fps', await fps())
await page.getByRole('button', { name: /Start tour|Next step/ }).click()
console.log('transition 1→2 fps', await fps())
for (const label of ['2→3', '3→4', '4→5']) {
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: /Start tour|Next step/ }).click()
  console.log('transition', label, 'fps', await fps())
}
await browser.close()
