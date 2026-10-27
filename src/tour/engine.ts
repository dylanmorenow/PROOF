// DOM helpers for the guided-tour engine: find a *visible* target, wait for it, and wait for scrolling to settle.

export interface Box {
  x: number
  y: number
  w: number
  h: number
  r: number
}

function isVisible(el: Element) {
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return false
  const style = getComputedStyle(el)
  return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.05
}

/** First visible element carrying `data-tour="<id>"` (desktop and mobile variants may both exist). */
export function findTarget(id: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${CSS.escape(id)}"]`)
  for (const el of all) if (isVisible(el)) return el
  return null
}

/** Resolve when the target exists, is visible and its rect has been stable for a few frames. */
export function waitForTarget(id: string, timeout: number, signal: AbortSignal): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const started = performance.now()
    let last = ''
    let stable = 0
    const tick = () => {
      if (signal.aborted) return resolve(null)
      const el = findTarget(id)
      if (el) {
        const r = el.getBoundingClientRect()
        const key = `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`
        stable = key === last ? stable + 1 : 0
        last = key
        if (stable >= 3) return resolve(el)
      }
      if (performance.now() - started > timeout) return resolve(el)
      requestAnimationFrame(tick)
    }
    tick()
  })
}

/** Resolve once window scroll position has stopped changing (or after a timeout). */
export function waitForScrollEnd(signal: AbortSignal, timeout = 1200): Promise<void> {
  return new Promise((resolve) => {
    const started = performance.now()
    let last = window.scrollY
    let still = 0
    const tick = () => {
      if (signal.aborted) return resolve()
      const y = window.scrollY
      still = Math.abs(y - last) < 0.5 ? still + 1 : 0
      last = y
      if (still >= 4 || performance.now() - started > timeout) return resolve()
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

export function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(t)
      resolve()
    })
  })
}

/** Spotlight box for an element: its rect plus padding, rounded like the element itself. */
export function boxFor(el: HTMLElement, padding: number): Box {
  const r = el.getBoundingClientRect()
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
  // Keep the ring fully on screen (e.g. a full-height sidebar flush with the viewport edge).
  const inset = 3
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const x0 = Math.max(inset, r.left - padding)
  const y0 = Math.max(inset, r.top - padding)
  const x1 = Math.min(vw - inset, r.right + padding)
  const y1 = Math.min(vh - inset, r.bottom + padding)
  const clamped = x0 > r.left - padding || y0 > r.top - padding || x1 < r.right + padding || y1 < r.bottom + padding
  if (clamped && x1 > x0 && y1 > y0) {
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, r: Math.min(radius + padding, 14) }
  }
  return { x: r.left - padding, y: r.top - padding, w: r.width + padding * 2, h: r.height + padding * 2, r: Math.min(radius + padding, 22) }
}

/** Rounded-rect hole cut out of a full-viewport rectangle (even-odd), for clip-path: path(). */
export function holePath(vw: number, vh: number, b: Box): string {
  const w = Math.max(0, b.w)
  const h = Math.max(0, b.h)
  const r = Math.max(0, Math.min(b.r, w / 2, h / 2))
  const { x, y } = b
  return (
    `M0 0H${vw}V${vh}H0Z` +
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  )
}
