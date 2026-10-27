import { ArrowRight, Clock, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useApp } from '@/app/store'
import { useTour } from '@/tour/tourStore'
import { TOURS } from '@/tour/tours'
import { cx } from '@/lib/cx'
import { spring } from '@/motion/tokens'
import { PipFallback } from './PipFallback'
import { canRender3D, usePip } from './pipStore'

const PipCanvas = lazy(() => import('./PipCanvas'))

/** Canvas box in CSS px; PIP is scaled from this to its dock or card-slot size. */
const BOX = 120
const DOCK = 92
const DOCK_MARGIN = 20

function useViewport() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return vp
}

function safeSession(key: string, value?: string) {
  try {
    if (value === undefined) return sessionStorage.getItem(key)
    sessionStorage.setItem(key, value)
  } catch {
    /* storage unavailable: behave as a first visit */
  }
  return null
}

export function PipLayer() {
  const { mood, anchor, progress, pickerOpen, setMood, setPickerOpen } = usePip()
  const touring = useTour((s) => !!s.tour)
  const startTour = useTour((s) => s.start)
  const reduce = useReducedMotion()
  const collapsed = useApp((s) => s.sidebarCollapsed)
  const vp = useViewport()
  const [use3D] = useState(canRender3D)
  const [ready3D, setReady3D] = useState(false)
  const [visible, setVisible] = useState(true)
  const [nudge, setNudge] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Load the 3D chunk once the page is idle, so it never competes with first paint.
  useEffect(() => {
    if (!use3D) return
    const ric = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 600))
    const id = ric(() => setReady3D(true))
    return () => (window.cancelIdleCallback ?? clearTimeout)(id as number)
  }, [use3D])

  // Pause rendering when the tab is hidden.
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  // A quiet first-visit invitation — never an auto-started tour.
  useEffect(() => {
    if (safeSession('pip-nudged')) return
    const t = setTimeout(() => setNudge(true), 3200)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (touring || pickerOpen) {
      setNudge(false)
      safeSession('pip-nudged', '1')
    }
  }, [touring, pickerOpen])

  // Close the picker on outside click / Escape.
  useEffect(() => {
    if (!pickerOpen) return
    const onDown = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setPickerOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPickerOpen(false)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen, setPickerOpen])

  // Tablet and desktop: PIP lives in the sidebar's empty space above its footer, so it never covers content.
  // Phones have no sidebar, so it floats bottom-right.
  const inSidebar = vp.w >= 768
  const dockSize = !inSidebar ? 60 : collapsed ? 56 : DOCK
  const dock = inSidebar
    ? { x: (collapsed ? 72 : 232) / 2, y: vp.h - 150 - dockSize / 2, size: dockSize }
    : { x: vp.w - DOCK_MARGIN - dockSize / 2, y: vp.h - DOCK_MARGIN - dockSize / 2, size: dockSize }
  const dockTop = dock.y - dockSize / 2
  const at = anchor ?? dock
  const scale = at.size / BOX

  return (
    <>
      {/* Dock pedestal stays put while PIP travels */}
      <div
        aria-hidden="true"
        className={cx('pointer-events-none fixed z-[44] rounded-full transition-opacity duration-500', anchor ? 'opacity-0' : 'opacity-100')}
        style={{ width: dockSize, height: dockSize, left: dock.x - dockSize / 2, top: dockTop }}
      >
        <div className="absolute inset-0 rounded-full border border-white/70 bg-white/70 shadow-[var(--shadow-raised)] backdrop-blur-xl" />
      </div>

      <motion.div
        ref={rootRef}
        className="fixed top-0 left-0 z-[95]"
        style={{ width: BOX, height: BOX, transformOrigin: '50% 50%' }}
        initial={false}
        animate={{ x: at.x - BOX / 2, y: at.y - BOX / 2, scale }}
        transition={reduce ? { duration: 0 } : { ...spring.smooth, stiffness: 140, damping: 22 }}
      >
        <button
          type="button"
          aria-label={touring ? 'PIP, your guide' : 'Open guided tours with PIP'}
          aria-haspopup="menu"
          aria-expanded={pickerOpen}
          data-tour="pip"
          disabled={touring}
          onClick={() => setPickerOpen(!pickerOpen)}
          onMouseEnter={() => !touring && setMood('attentive')}
          onMouseLeave={() => !touring && setMood('idle')}
          onFocus={() => !touring && setMood('attentive')}
          onBlur={() => !touring && setMood('idle')}
          className="group absolute inset-0 grid place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan disabled:cursor-default"
        >
          <span className="relative grid size-full place-items-center">
            {use3D && ready3D ? (
              <Suspense fallback={<PipFallback mood={mood} progress={progress} size={BOX} />}>
                <PipCanvas size={BOX} active={visible} />
              </Suspense>
            ) : (
              <PipFallback mood={mood} progress={progress} size={BOX} />
            )}
          </span>
        </button>
      </motion.div>

      {/* Hover label + first-visit nudge */}
      <AnimatePresence>
        {!touring && !pickerOpen && nudge && (
          <motion.button
            key="nudge"
            initial={{ opacity: 0, x: 10, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 6 }}
            transition={spring.smooth}
            onClick={() => {
              setNudge(false)
              startTour('welcome')
            }}
            className="fixed z-[94] flex items-center gap-2 rounded-full border border-line bg-white/90 backdrop-blur-xl py-2 pr-2 pl-4 text-[13px] font-medium text-text-1 shadow-[var(--shadow-raised)] hover:bg-white"
            style={inSidebar ? { left: dock.x + dockSize / 2 + 12, top: dock.y - 19 } : { right: DOCK_MARGIN + dockSize + 12, bottom: DOCK_MARGIN + dockSize / 2 - 19 }}
          >
            New here? Take a quick tour
            <span className="grid size-6 place-items-center rounded-full bg-teal text-white">
              <ArrowRight className="size-3.5" />
            </span>
            <span
              role="button"
              tabIndex={0}
              aria-label="Dismiss"
              onClick={(e) => {
                e.stopPropagation()
                setNudge(false)
                safeSession('pip-nudged', '1')
              }}
              className="grid size-6 place-items-center rounded-full text-text-3 hover:text-text-1"
            >
              <X className="size-3.5" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tour picker */}
      <AnimatePresence>
        {pickerOpen && !touring && (
          <motion.div
            role="menu"
            aria-label="Guided tours"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12 } }}
            transition={spring.smooth}
            className={cx('fixed z-[96] w-[320px] rounded-[18px] border border-line bg-white/90 p-2 shadow-[var(--shadow-raised)] backdrop-blur-xl', inSidebar ? 'origin-bottom-left' : 'origin-bottom-right')}
            style={inSidebar ? { left: 12, bottom: vp.h - dockTop + 12 } : { right: DOCK_MARGIN, bottom: DOCK_MARGIN + dockSize + 12 }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="px-3 pt-2.5 pb-2">
              <div className="text-[13.5px] font-semibold text-text-1">Guided tours with PIP</div>
              <div className="text-[12px] text-text-2">Pick a walkthrough. Esc exits at any time.</div>
            </div>
            {TOURS.map((t, i) => {
              const available = t.steps.length > 0
              return (
                <button
                  key={t.id}
                  role="menuitem"
                  disabled={!available}
                  autoFocus={i === 0}
                  onClick={() => startTour(t.id)}
                  className="group flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left outline-none transition-colors hover:bg-black/[.04] focus-visible:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-soft text-[12px] font-semibold text-cyan">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[13px] font-medium text-text-1">
                      {t.title}
                      {i === 0 && <span className="rounded-full bg-cyan-soft px-1.5 text-[10px] font-semibold text-cyan">Start here</span>}
                    </span>
                    <span className="block truncate text-[11.5px] text-text-2">{t.summary}</span>
                  </span>
                  {available && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-text-3 tabular">
                      <Clock className="size-3" />
                      {t.duration}
                    </span>
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
