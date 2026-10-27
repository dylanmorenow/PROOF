import { ArrowRight, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useTour } from '@/tour/tourStore'
import { tourFor } from '@/tour/tours'
import { cx } from '@/lib/cx'
import { spring } from '@/motion/tokens'
import { PipFallback } from './PipFallback'
import { canRender3D, usePip } from './pipStore'

const PipCanvas = lazy(() => import('./PipCanvas'))

/** Canvas box in CSS px; PIP is scaled from this to its dock or card-slot size. */
const BOX = 120
const DOCK = 80
const DOCK_MARGIN = 20

/** Layout viewport (excludes scrollbars), matching what CSS `right`/`bottom` measure from. */
function useViewport() {
  const read = () => ({ w: document.documentElement.clientWidth, h: document.documentElement.clientHeight })
  const [vp, setVp] = useState(read)
  useEffect(() => {
    const on = () => setVp(read())
    // A scrollbar appearing changes clientWidth without a resize event, so watch the root element too.
    const ro = new ResizeObserver(on)
    ro.observe(document.documentElement)
    window.addEventListener('resize', on)
    return () => (ro.disconnect(), window.removeEventListener('resize', on))
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
  const { mood, anchor, progress, setMood } = usePip()
  const touring = useTour((s) => !!s.tour)
  const startTour = useTour((s) => s.start)
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const vp = useViewport()
  const [use3D] = useState(canRender3D)
  const [ready3D, setReady3D] = useState(false)
  const [visible, setVisible] = useState(true)
  const [nudge, setNudge] = useState(false)
  const startHere = () => startTour(tourFor(pathname))

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

  // A quiet first-visit invitation, never an auto-started tour.
  useEffect(() => {
    if (safeSession('pip-nudged')) return
    const t = setTimeout(() => setNudge(true), 3200)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (touring) {
      setNudge(false)
      safeSession('pip-nudged', '1')
    }
  }, [touring])

  const dockSize = vp.w < 640 ? 60 : DOCK
  const dock = { x: vp.w - DOCK_MARGIN - dockSize / 2, y: vp.h - DOCK_MARGIN - dockSize / 2, size: dockSize }
  // The anchor only counts during a tour: the closing overlay can write one late, which used to strand PIP mid-screen.
  const docked = !touring || !anchor
  const at = docked ? dock : anchor
  const scale = at.size / BOX

  return (
    <>
      {/* Dock pedestal stays put while PIP travels */}
      <div
        aria-hidden="true"
        className={cx('pointer-events-none fixed z-[44] rounded-full transition-opacity duration-500', !docked ? 'opacity-0' : 'opacity-100')}
        style={{ width: dockSize, height: dockSize, right: DOCK_MARGIN, bottom: DOCK_MARGIN }}
      >
        <div className="absolute inset-0 rounded-full border border-white/70 bg-white/70 shadow-[var(--shadow-raised)] backdrop-blur-xl" />
      </div>

      <motion.div
        className="fixed top-0 left-0 z-[95]"
        style={{ width: BOX, height: BOX, transformOrigin: '50% 50%' }}
        initial={false}
        animate={{ x: at.x - BOX / 2, y: at.y - BOX / 2, scale }}
        transition={reduce ? { duration: 0 } : { ...spring.smooth, stiffness: 140, damping: 22 }}
      >
        <button
          type="button"
          aria-label={touring ? 'PIP, your guide' : 'Start the guided tour for this page'}
          data-tour="pip"
          disabled={touring}
          onClick={startHere}
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

      {/* First-visit nudge */}
      <AnimatePresence>
        {!touring && nudge && (
          <motion.button
            key="nudge"
            initial={{ opacity: 0, x: 10, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 6 }}
            transition={spring.smooth}
            onClick={() => {
              setNudge(false)
              startHere()
            }}
            className="fixed z-[94] flex items-center gap-2 rounded-full border border-line bg-white/90 py-2 pr-2 pl-4 text-[13px] font-medium text-text-1 shadow-[var(--shadow-raised)] backdrop-blur-xl hover:bg-white"
            style={{ right: DOCK_MARGIN + dockSize + 12, bottom: DOCK_MARGIN + dockSize / 2 - 19 }}
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
    </>
  )
}
