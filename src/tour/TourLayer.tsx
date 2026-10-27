import { computePosition, flip, offset, shift, type Placement } from '@floating-ui/react-dom'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { cx } from '@/lib/cx'
import { spring } from '@/motion/tokens'
import { usePip } from '@/pip/pipStore'
import { Button } from '@/ui/Button'
import { boxFor, findTarget, holePath, wait, waitForScrollEnd, waitForTarget, type Box } from './engine'
import { useTour } from './tourStore'
import type { TourContext, TourDef } from './types'

const HEADER_SAFE = 76
const EDGE = 16
const CARD_W = 372
const SLOT = 56

type Phase = 'resolving' | 'ready' | 'missing'

export function TourLayer() {
  const tour = useTour((s) => s.tour)
  return <AnimatePresence>{tour && <TourOverlay key={tour.id} tour={tour} />}</AnimatePresence>
}

function useViewport() {
  const read = () => ({ w: document.documentElement.clientWidth, h: window.innerHeight })
  const [vp, setVp] = useState(read)
  useEffect(() => {
    const on = () => setVp(read())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return vp
}

function TourOverlay({ tour }: { tour: TourDef }) {
  const { index, direction, next, back, end } = useTour()
  const step = tour.steps[index]
  const navigate = useNavigate()
  const location = useLocation()
  const reduce = useReducedMotion()
  const vp = useViewport()
  const isMobile = vp.w < 640

  const [phase, setPhase] = useState<Phase>('resolving')
  const [box, setBox] = useState<Box | null>(null)
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null)
  /** True while the spotlight travels: the backdrop blur is paused then, it is the costly layer. */
  const [moving, setMoving] = useState(false)
  const movingTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const cardRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  const stepStarted = useRef(0)
  const ctxRef = useRef<TourContext>({ navigate, isMobile })
  ctxRef.current = { navigate, isMobile }

  /* ── spotlight geometry: springs for step-to-step travel, jumps for scroll tracking ── */
  const sp = reduce ? { stiffness: 1000, damping: 100 } : spring.spotlight
  const cx0 = vp.w / 2
  const cy0 = vp.h / 2
  const hx = useSpring(cx0, sp)
  const hy = useSpring(cy0, sp)
  const hw = useSpring(0, sp)
  const hh = useSpring(0, sp)
  const hr = useSpring(12, sp)
  const vw = useMotionValue(vp.w)
  const vh = useMotionValue(vp.h)
  useEffect(() => {
    vw.set(vp.w)
    vh.set(vp.h)
  }, [vp, vw, vh])
  // Guide line start: PIP's slot in the card, springing along with it.
  const ax = useSpring(cx0, sp)
  const ay = useSpring(cy0, sp)
  const guide = useTransform([ax, ay, hx, hy, hw, hh], ([x, y, bx, by, bw, bh]: number[]) => {
    // Aim at the nearest point on the spotlight's edge, bending through an elbow so it reads as pointing.
    const tx = Math.min(Math.max(x, bx), bx + bw)
    const ty = Math.min(Math.max(y, by), by + bh)
    return `M${x} ${y} Q${tx} ${y} ${tx} ${ty}`
  })
  const guideEnd = useTransform([ax, ay, hx, hy, hw, hh], ([x, y, bx, by, bw, bh]: number[]) => ({
    x: Math.min(Math.max(x, bx), bx + bw),
    y: Math.min(Math.max(y, by), by + bh),
  }))
  const dotX = useTransform(guideEnd, (p) => p.x)
  const dotY = useTransform(guideEnd, (p) => p.y)
  const clip = useTransform([hx, hy, hw, hh, hr, vw, vh], ([x, y, w, h, r, W, H]: number[]) => `path(evenodd, "${holePath(W, H, { x, y, w, h, r })}")`)

  const applyBox = useCallback(
    (b: Box | null, mode: 'spring' | 'jump') => {
      const target = b ?? { x: document.documentElement.clientWidth / 2, y: window.innerHeight / 2, w: 0, h: 0, r: 12 }
      const set = (mv: typeof hx, v: number) => (mode === 'jump' ? mv.jump(v) : mv.set(v))
      if (mode === 'spring') {
        setMoving(true)
        clearTimeout(movingTimer.current)
        movingTimer.current = setTimeout(() => setMoving(false), 650)
      }
      set(hx, target.x)
      set(hy, target.y)
      set(hw, target.w)
      set(hh, target.h)
      set(hr, target.r)
      setBox(b)
    },
    [hx, hy, hw, hh, hr],
  )

  /* ── resolve the current step: prepare → navigate → wait → scroll → spotlight ── */
  useEffect(() => {
    const ac = new AbortController()
    const ctx = ctxRef.current
    stepStarted.current = performance.now()
    setPhase('resolving')
    targetRef.current = null
    step.prepare?.(ctx)

    const run = async () => {
      let navigated = false
      if (step.route && location.pathname + location.search !== step.route) {
        applyBox(null, 'spring')
        navigate(step.route)
        navigated = true
      }
      if (!step.target) {
        if (navigated) await wait(320, ac.signal)
        applyBox(null, 'spring')
        setPhase('ready')
        return
      }
      if (navigated) await wait(340, ac.signal)
      const el = await waitForTarget(step.target, 2600, ac.signal)
      if (ac.signal.aborted) return
      if (!el) {
        applyBox(null, 'spring')
        setPhase('missing')
        usePip.getState().react('unavailable')
        return
      }
      targetRef.current = el
      const pad = step.padding ?? 8
      const b = boxFor(el, pad)
      // Scroll so the target sits in the clear area (below the sticky header, above a mobile sheet).
      const sheet = ctx.isMobile ? (cardRef.current?.offsetHeight ?? 260) + 24 : EDGE
      const isFixed = getComputedStyle(el).position === 'fixed' || !!el.closest('aside')
      const top = HEADER_SAFE
      const avail = window.innerHeight - top - sheet
      let delta = 0
      if (!isFixed && (b.y < top || b.y + b.h > window.innerHeight - sheet)) {
        delta = b.h <= avail ? b.y - (top + (avail - b.h) / 2) : b.y - top
        const max = document.documentElement.scrollHeight - window.innerHeight
        delta = Math.max(-window.scrollY, Math.min(max - window.scrollY, delta))
      }
      if (Math.abs(delta) > 1) {
        // Travel to where the target *will* be, while the page scrolls underneath.
        applyBox({ ...b, y: b.y - delta }, 'spring')
        window.scrollTo({ top: window.scrollY + delta, behavior: reduce ? 'instant' : 'smooth' })
        await waitForScrollEnd(ac.signal)
        if (ac.signal.aborted) return
        applyBox(boxFor(el, pad), 'spring')
      } else {
        applyBox(b, 'spring')
      }
      setPhase('ready')
    }
    void run()
    return () => {
      ac.abort()
      step.cleanup?.(ctx)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  /* ── follow the target: resize, scroll (any container), layout shifts ── */
  useEffect(() => {
    if (phase !== 'ready' || !step.target) return
    const el = targetRef.current
    if (!el) return
    let raf = 0
    const measure = () => {
      raf = 0
      let target = el.isConnected ? el : findTarget(step.target!)
      if (!target) return
      targetRef.current = target
      const b = boxFor(target, step.padding ?? 8)
      const recent = performance.now() - stepStarted.current < 900
      applyBox(b, recent ? 'spring' : 'jump')
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    ro.observe(document.body)
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
    }
  }, [phase, step, applyBox])

  /* ── position the explanation card next to the spotlight ── */
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    if (isMobile) {
      setCardPos({ x: 12, y: vp.h - card.offsetHeight - 12 })
      return
    }
    const cw = card.offsetWidth
    const ch = card.offsetHeight
    if (!box || phase !== 'ready') {
      setCardPos({ x: (vp.w - cw) / 2, y: Math.max(HEADER_SAFE, (vp.h - ch) / 2) })
      return
    }
    // A target that fills most of the screen: dock the card inside its lower-right corner.
    if (box.w > vp.w * 0.62 && box.h > vp.h * 0.5) {
      setCardPos({ x: vp.w - cw - 28, y: vp.h - ch - 28 })
      return
    }
    const reference = { getBoundingClientRect: () => ({ x: box.x, y: box.y, left: box.x, top: box.y, width: box.w, height: box.h, right: box.x + box.w, bottom: box.y + box.h }) }
    let cancelled = false
    computePosition(reference, card, {
      strategy: 'fixed',
      placement: (step.placement ?? 'bottom') as Placement,
      middleware: [offset(28), flip({ padding: EDGE, fallbackAxisSideDirection: 'start' }), shift({ padding: EDGE })],
    }).then(({ x, y }) => {
      if (!cancelled) setCardPos({ x, y: Math.max(EDGE, Math.min(y, vp.h - ch - EDGE)) })
    })
    return () => {
      cancelled = true
    }
  }, [box, phase, vp, isMobile, step])

  /* ── keep PIP in the card slot, looking at the target, halo showing progress ── */
  useEffect(() => {
    const pip = usePip.getState()
    pip.setMood('guiding')
    pip.setProgress((index + 1) / tour.steps.length)
  }, [index, tour.steps.length])
  useEffect(() => {
    if (!cardPos || !slotRef.current) return
    const s = slotRef.current
    const x = cardPos.x + s.offsetLeft + SLOT / 2
    const y = cardPos.y + s.offsetTop + SLOT / 2
    usePip.getState().setAnchor({ x, y, size: SLOT + 14 })
    ax.set(x)
    ay.set(y)
  }, [cardPos])
  useEffect(() => {
    usePip.getState().setGaze(box ? { x: box.x + box.w / 2, y: box.y + box.h / 2 } : null)
  }, [box])

  /* ── focus + keyboard: Esc exits, arrows navigate, Tab stays in the card ── */
  useEffect(() => {
    if (phase !== 'resolving') titleRef.current?.focus({ preventScroll: true })
  }, [phase, index])
  useEffect(() => {
    document.documentElement.dataset.tour = 'on'
    const opener = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        end()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        back()
      } else if (e.key === 'Tab' && cardRef.current) {
        const items = cardRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href]')
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (!cardRef.current.contains(document.activeElement)) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      delete document.documentElement.dataset.tour
      const pip = document.querySelector<HTMLElement>('[data-tour="pip"]')
      ;(opener?.isConnected ? opener : pip)?.focus({ preventScroll: true })
    }
  }, [end, next, back])

  const last = index === tour.steps.length - 1
  // The intro invitation is not counted as a step.
  const steps = tour.steps.filter((x) => !x.intro)
  const stepNo = steps.indexOf(step) + 1
  const hasHole = !!box && phase === 'ready'
  const blockHole = hasHole && !step.interactive

  return (
    <motion.div
      className="fixed inset-0 z-[90]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: reduce ? 0.12 : 0.35 }}
    >
      {/* Blur + dim layers share the same cut-out, so the target stays perfectly crisp. */}
      {!reduce && (
        <motion.div
          aria-hidden="true"
          className={cx('absolute inset-0 backdrop-blur-[2px] transition-opacity', moving ? 'opacity-0 duration-150' : 'opacity-100 duration-300')}
          style={{ clipPath: clip, visibility: moving ? 'hidden' : 'visible', transitionProperty: 'opacity, visibility', transitionDelay: moving ? '0s, 150ms' : '0s' }}
        />
      )}
      <motion.div aria-hidden="true" className="absolute inset-0 bg-[rgb(15_23_42/.3)]" style={{ clipPath: clip }} />

      {/* Spotlight ring */}
      <motion.div
        aria-hidden="true"
        className="tour-ring pointer-events-none absolute top-0 left-0"
        style={{ x: hx, y: hy, width: hw, height: hh, borderRadius: hr, opacity: hasHole ? 1 : 0 }}
      />
      {blockHole && <motion.div className="absolute top-0 left-0" style={{ x: hx, y: hy, width: hw, height: hh }} />}


      <div className="sr-only" aria-live="polite">
        {step.intro ? step.title : `Step ${stepNo} of ${steps.length}, ${step.title}`}
      </div>

      {/* Explanation card */}
      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className={cx(
          'fixed top-0 left-0 rounded-[20px] border border-white/60 bg-white/85 shadow-[0_24px_60px_-12px_rgb(15_23_42/.35)] backdrop-blur-2xl backdrop-saturate-150',
        )}
        style={{ width: isMobile ? 'calc(100% - 24px)' : CARD_W }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={cardPos ? { opacity: 1, scale: 1, x: cardPos.x, y: cardPos.y } : { opacity: 0 }}
        transition={reduce ? { duration: 0.12 } : { ...spring.smooth, opacity: { duration: 0.25 } }}
      >
        <div className="flex items-start justify-between px-5 pt-5">
          <div ref={slotRef} className="size-14 shrink-0" aria-hidden="true" />
          <button onClick={() => end()} className="-mr-2 grid size-8 place-items-center rounded-full text-text-3 transition-colors hover:bg-black/5 hover:text-text-1" aria-label="Exit tour">
            <X className="size-4" />
          </button>
        </div>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction * 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -18 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="px-5 pt-3"
            >
              <h2 id="tour-title" ref={titleRef} tabIndex={-1} className="type-display text-[20px] leading-snug text-text-1 outline-none">
                {phase === 'missing' ? 'This part is not on screen' : step.title}
              </h2>
              <p id="tour-body" className="mt-2 text-[15px] leading-relaxed text-text-2">
                {phase === 'missing' ? 'It may be hidden at this screen size. You can skip ahead.' : step.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 px-5 pt-5 pb-5">
          {step.intro ? (
            <>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => end()}>
                Not now
              </Button>
              <Button size="sm" variant="primary" onClick={next} aria-label="Start tour">
                Start tour
              </Button>
            </>
          ) : (
            <>
              <div className="mr-auto flex gap-1.5" aria-hidden="true">
                {steps.map((s, i) => (
                  <span key={s.id} className={cx('size-1.5 rounded-full transition-colors duration-300', i === stepNo - 1 ? 'bg-cyan' : 'bg-black/15')} />
                ))}
              </div>
              <Button size="sm" variant="secondary" onClick={back} aria-label="Previous step">
                <ArrowLeft /> Back
              </Button>
              <Button size="sm" variant="primary" onClick={next} aria-label={last ? 'Finish tour' : 'Next step'}>
                {last ? 'Done' : 'Next'} {!last && <ArrowRight />}
              </Button>
            </>
          )}
        </div>
      </motion.div>
      {/* Guide line, drawn above the card so it visibly leaves PIP and lands on the spotlight */}
      <svg aria-hidden="true" className={cx('pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300', hasHole && !moving ? 'opacity-100' : 'opacity-0')}>
        <motion.path d={guide} fill="none" stroke="#3FA9BB" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 6" className="[animation:link-flow_1.2s_linear_infinite]" />
        <motion.circle cx={dotX} cy={dotY} r="5" fill="#127C91" stroke="#fff" strokeWidth="2" />
      </svg>
    </motion.div>
  )
}
