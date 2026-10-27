import { Info, Layers, PanelLeft, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { NavLink, useMatch } from 'react-router'
import { useApp } from '@/app/store'
import { cx } from '@/lib/cx'
import { spring } from '@/motion/tokens'
import { Seal } from '@/ui/Seal'
import { Tooltip } from '@/ui/Tooltip'
import { NAV, type NavItem } from './nav'

const row = 'flex h-9 items-center gap-3 rounded-[10px] text-[14px] font-medium transition-colors active:scale-[.98]'

function NavRow({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const Icon = item.icon
  // Plain values, not NavLink render functions: Radix Tooltip's asChild merges className as a string.
  const isActive = !!useMatch({ path: item.to, end: item.to === '/' })
  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      data-tour={item.tour}
      className={cx(row, 'relative', collapsed ? 'justify-center' : 'px-3', isActive ? 'text-text-1' : 'text-text-2 hover:bg-black/[.04] hover:text-text-1')}
    >
      {isActive && <motion.span layoutId="nav-active" transition={spring.snappy} className="absolute inset-0 rounded-[10px] bg-white shadow-[var(--shadow-card)]" />}
      <Icon className={cx('relative size-[18px] shrink-0', isActive ? 'text-cyan' : 'text-text-3')} strokeWidth={1.8} />
      {!collapsed && <span className="relative truncate">{item.label}</span>}
    </NavLink>
  )
  return collapsed ? (
    <Tooltip content={item.label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  )
}

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { lens, toggleLens, toggleSidebar, setAboutOpen } = useApp()
  const footer = cx(row, 'text-text-2 hover:bg-black/[.04] hover:text-text-1', collapsed ? 'w-9 justify-center' : 'px-3')
  return (
    <div className="flex h-full flex-col px-3" data-tour="nav.sidebar">
      <div className={cx('flex h-16 shrink-0 items-center gap-2.5', collapsed ? 'justify-center' : 'px-2')}>
        <Seal size={26} />
        {!collapsed && <span className="text-[16px] font-semibold tracking-[-0.01em]">PROOF Room</span>}
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 pt-2">
        {NAV.filter((n) => n.group === 'workspace').map((n) => (
          <NavRow key={n.to} item={n} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
        <div className={cx('mt-5 mb-1 text-[12px] font-medium text-text-3', collapsed ? 'sr-only' : 'px-3')}>Innovation concept</div>
        {NAV.filter((n) => n.group === 'innovation').map((n) => (
          <NavRow key={n.to} item={n} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className={cx('flex flex-col gap-0.5 py-3', collapsed && 'items-center')}>
        <button onClick={toggleLens} aria-pressed={lens} data-tour="nav.lens" className={cx(footer, lens && '!text-cyan')} title="Strategy lens (L)">
          <Layers className="size-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && <span className="flex-1 text-left">Strategy lens</span>}
          {!collapsed && <span className={cx('relative h-[18px] w-8 rounded-full transition-colors', lens ? 'bg-teal' : 'bg-black/15')}><motion.span layout transition={spring.snappy} className={cx('absolute top-0.5 size-[14px] rounded-full bg-white shadow', lens ? 'right-0.5' : 'left-0.5')} /></span>}
        </button>
        <button onClick={() => setAboutOpen(true)} className={footer} aria-label="About this prototype">
          <Info className="size-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && 'About'}
        </button>
        <button onClick={toggleSidebar} className={cx(footer, 'hidden md:flex')} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title="Toggle sidebar ([)">
          <PanelLeft className="size-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const collapsed = useApp((s) => s.sidebarCollapsed)
  const mobileOpen = useApp((s) => s.mobileNavOpen)
  const setMobileNav = useApp((s) => s.setMobileNav)
  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 232 }}
        transition={spring.smooth}
        className="fixed inset-y-0 left-0 z-30 hidden border-r border-line bg-[rgb(238_241_244/.75)] backdrop-blur-xl md:block"
      >
        <SidebarBody collapsed={collapsed} />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/25 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[272px] bg-bg-1 shadow-[var(--shadow-raised)] md:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={spring.smooth}
              aria-label="Navigation"
            >
              <button onClick={() => setMobileNav(false)} className="absolute top-4 right-3 z-10 grid size-8 place-items-center rounded-full text-text-2 hover:bg-black/5" aria-label="Close navigation">
                <X className="size-4" />
              </button>
              <SidebarBody collapsed={false} onNavigate={() => setMobileNav(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
