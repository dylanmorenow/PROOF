import { Info, Layers, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { NavLink, useLocation } from 'react-router'
import { useApp } from '@/app/store'
import { cx } from '@/lib/cx'
import { spring } from '@/motion/tokens'
import { Kbd } from '@/ui/Kbd'
import { Seal } from '@/ui/Seal'
import { Tooltip } from '@/ui/Tooltip'
import { NAV, type NavItem } from './nav'

function isActivePath(item: NavItem, pathname: string) {
  return item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
}

function NavRow({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const active = isActivePath(item, pathname)
  const Icon = item.icon
  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      data-tour={item.tour}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'group relative flex h-9 items-center gap-3 rounded-[8px] text-[13.5px] font-medium outline-none transition-colors duration-150',
        collapsed ? 'justify-center px-0' : 'px-3',
        active ? 'text-text-1' : 'text-text-2 hover:bg-[rgb(142_164_181/.07)] hover:text-text-1',
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          transition={spring.snappy}
          className="absolute inset-0 rounded-[8px] border border-[rgb(118_207_218/.16)] bg-[linear-gradient(90deg,rgb(18_124_145/.28),rgb(18_124_145/.08))]"
        >
          <span className="absolute top-1/2 -left-px h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-cyan shadow-[0_0_10px_rgb(118_207_218/.7)]" />
        </motion.span>
      )}
      <Icon className={cx('relative size-[18px] shrink-0 transition-colors', active ? 'text-cyan' : 'text-text-3 group-hover:text-text-2')} strokeWidth={1.6} />
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
  return (
    <div className="flex h-full flex-col" data-tour="nav.sidebar">
      <div className={cx('flex h-16 shrink-0 items-center gap-2.5', collapsed ? 'justify-center' : 'px-5')}>
        <Seal size={28} />
        {!collapsed && (
          <div className="min-w-0 leading-none">
            <div className="type-display text-[15px] font-[650] text-text-1">
              PROOF <span className="font-[450] text-text-2">Room</span>
            </div>
            <div className="mt-1 truncate text-[10.5px] tracking-wide text-text-3">PT Energy · Customer workspace</div>
          </div>
        )}
      </div>

      <nav aria-label="Primary" className={cx('flex flex-1 flex-col gap-6 pt-3', collapsed ? 'px-3' : 'px-3')}>
        <div className="flex flex-col gap-0.5">
          {!collapsed && <div className="eyebrow mb-1.5 px-3 !text-text-3">Workspace</div>}
          {NAV.filter((n) => n.group === 'workspace').map((n) => (
            <NavRow key={n.to} item={n} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="flex flex-col gap-0.5">
          {!collapsed ? (
            <div className="mb-1.5 flex items-center justify-between px-3">
              <span className="eyebrow !text-text-3">Innovation</span>
              <span className="rounded-full border border-[rgb(233_162_59/.35)] px-1.5 text-[9.5px] font-semibold tracking-wider text-amber uppercase">Concept</span>
            </div>
          ) : (
            <div className="mx-auto mb-1.5 h-px w-6 bg-line-strong" />
          )}
          {NAV.filter((n) => n.group === 'innovation').map((n) => (
            <NavRow key={n.to} item={n} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className={cx('flex flex-col gap-1 border-t border-line py-3', collapsed ? 'items-center px-3' : 'px-3')}>
        <Tooltip content="Tag each module with the strategy option it delivers (L)" side="right">
          <button
            onClick={toggleLens}
            aria-pressed={lens}
            data-tour="nav.lens"
            className={cx(
              'flex h-9 items-center gap-3 rounded-[8px] text-[13px] font-medium transition-colors',
              collapsed ? 'w-9 justify-center' : 'px-3',
              lens ? 'bg-cyan-soft text-cyan' : 'text-text-2 hover:bg-[rgb(142_164_181/.07)] hover:text-text-1',
            )}
          >
            <Layers className="size-[18px] shrink-0" strokeWidth={1.6} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Strategy lens</span>
                <span className={cx('relative h-4 w-7 rounded-full transition-colors', lens ? 'bg-teal' : 'bg-[rgb(142_164_181/.22)]')}>
                  <motion.span layout transition={spring.snappy} className={cx('absolute top-0.5 size-3 rounded-full bg-text-1', lens ? 'right-0.5' : 'left-0.5')} />
                </span>
              </>
            )}
          </button>
        </Tooltip>
        <button
          onClick={() => setAboutOpen(true)}
          className={cx(
            'flex h-9 items-center gap-3 rounded-[8px] text-[13px] font-medium text-text-2 transition-colors hover:bg-[rgb(142_164_181/.07)] hover:text-text-1',
            collapsed ? 'w-9 justify-center' : 'px-3',
          )}
          aria-label="About this prototype"
        >
          <Info className="size-[18px] shrink-0" strokeWidth={1.6} />
          {!collapsed && 'About this prototype'}
        </button>
        <button
          onClick={toggleSidebar}
          className={cx(
            'hidden h-9 items-center gap-3 rounded-[8px] text-[13px] font-medium text-text-3 transition-colors hover:bg-[rgb(142_164_181/.07)] hover:text-text-1 md:flex',
            collapsed ? 'w-9 justify-center' : 'px-3',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="size-[18px]" strokeWidth={1.6} /> : <PanelLeftClose className="size-[18px]" strokeWidth={1.6} />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Collapse</span>
              <Kbd>[</Kbd>
            </>
          )}
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
        animate={{ width: collapsed ? 72 : 248 }}
        transition={spring.smooth}
        className="fixed inset-y-0 left-0 z-30 hidden border-r border-line bg-[rgb(11_27_44/.82)] backdrop-blur-[2px] md:block"
      >
        <SidebarBody collapsed={collapsed} />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-[rgb(4_10_18/.6)] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNav(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[272px] border-r border-line bg-bg-1 md:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={spring.smooth}
              aria-label="Navigation"
            >
              <button onClick={() => setMobileNav(false)} className="absolute top-4 right-3 grid size-8 place-items-center rounded-md text-text-2 hover:text-text-1" aria-label="Close navigation">
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
