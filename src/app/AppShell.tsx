import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { useApp } from '@/app/store'
import { PipLayer } from '@/pip/PipLayer'
import { TourLayer } from '@/tour/TourLayer'
import { TooltipProvider } from '@/ui/Tooltip'
import { AboutDialog } from './AboutDialog'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

function useShortcuts() {
  const { toggleSidebar, toggleLens } = useApp()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select, [contenteditable="true"]') || document.documentElement.dataset.tour === 'on') return
      if (e.key === '[') toggleSidebar()
      if (e.key === 'l' || e.key === 'L') toggleLens()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleSidebar, toggleLens])
}

function useResponsiveSidebar() {
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1279px)')
    const apply = () => useApp.setState({ sidebarCollapsed: mq.matches })
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
}

export function AppShell() {
  const location = useLocation()
  const outlet = useOutlet()
  const collapsed = useApp((s) => s.sidebarCollapsed)
  const lens = useApp((s) => s.lens)
  useShortcuts()
  useResponsiveSidebar()

  useEffect(() => {
    document.documentElement.classList.toggle('lens', lens)
  }, [lens])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <div className="app-ambient" aria-hidden="true" />
        <a href="#main" className="sr-only z-50 rounded bg-surface-2 px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          Skip to content
        </a>
        <Sidebar />
        <div className="relative z-10 min-h-dvh transition-[padding] duration-300 ease-[var(--ease-out-expo)] md:pl-[var(--content-offset)]" style={{ ['--content-offset' as string]: collapsed ? '72px' : '248px' }}>
          <Header />
          <main id="main" className="relative mx-auto max-w-[1600px] px-4 pt-6 pb-32 md:px-8 md:pt-8">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <AboutDialog />
        <PipLayer />
        <TourLayer />
      </TooltipProvider>
    </MotionConfig>
  )
}
