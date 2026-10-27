import * as Dropdown from '@radix-ui/react-dropdown-menu'
import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown, ChevronRight, FlaskConical, Menu } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { useApp } from '@/app/store'
import { activeWorkOrders, PERIODS } from '@/data/selectors'
import type { AccountScope } from '@/data/types'
import { cx } from '@/lib/cx'
import { SegmentedControl } from '@/ui/SegmentedControl'

function AccountMonogram({ label, all }: { label: string; all?: boolean }) {
  return (
    <span
      className={cx(
        'grid size-6 shrink-0 place-items-center rounded-full text-[9px] font-semibold',
        all ? 'bg-teal text-white' : 'bg-teal-soft text-cyan',
      )}
    >
      {label}
    </span>
  )
}

export function AccountSelector() {
  const { dataset, account, setAccount } = useApp()
  const options = useMemo(
    () => [
      { id: 'all' as AccountScope, name: 'All accounts', short: 'ALL', sub: 'Portfolio view', count: activeWorkOrders(dataset, 'all').length },
      ...dataset.customers.map((c) => ({ id: c.id as AccountScope, name: c.name, short: c.short, sub: c.sector, count: activeWorkOrders(dataset, c.id).length })),
    ],
    [dataset],
  )
  const current = options.find((o) => o.id === account)!
  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        data-tour="header.account"
        className="group flex h-9 max-w-[260px] items-center gap-2.5 rounded-full border border-line bg-white pr-3 pl-1.5 text-left shadow-[var(--shadow-card)] transition-colors hover:bg-surface-3"
        aria-label={`Customer account: ${current.name}`}
      >
        <AccountMonogram label={current.short} all={current.id === 'all'} />
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[13px] font-medium text-text-1">{current.name}</span>
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-text-3 transition-transform group-data-[state=open]:rotate-180" />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={6}
          className="z-[60] w-[300px] origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-[14px] border border-line bg-white/90 p-1.5 shadow-[var(--shadow-raised)] backdrop-blur-xl data-[state=open]:animate-[pop-in_.18s_var(--ease-out-expo)]"
        >
          {options.map((o, i) => (
            <Dropdown.Item
              key={o.id}
              onSelect={() => setAccount(o.id)}
              className={cx(
                'flex cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-2 outline-none data-[highlighted]:bg-black/[.04]',
                i === 0 && 'mb-1',
              )}
            >
              <AccountMonogram label={o.short} all={o.id === 'all'} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-text-1">{o.name}</span>
                <span className="block truncate text-[11.5px] text-text-2">{o.sub}</span>
              </span>
              <span className="text-[11.5px] text-text-2 tabular">{o.count} active</span>
              <Check className={cx('size-3.5 text-cyan', o.id !== account && 'invisible')} />
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}

function PrototypeChip() {
  return (
    <Popover.Root>
      <Popover.Trigger
        data-tour="header.prototype"
        className="hidden h-7 items-center gap-1.5 rounded-full bg-amber-soft px-3 text-[12px] font-medium text-amber transition-colors hover:bg-[rgb(233_162_59/.22)] lg:inline-flex"
      >
        <FlaskConical className="size-3.5" strokeWidth={1.8} />
        Prototype
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-[60] w-[320px] rounded-[14px] border border-line bg-white p-4 text-[13px] leading-relaxed text-text-2 shadow-[var(--shadow-raised)] data-[state=open]:animate-[pop-in_.18s_var(--ease-out-expo)]"
        >
          <div className="mb-1.5 text-[13px] font-semibold text-text-1">Interactive prototype</div>
          PROOF Room is a frontend-only demonstration for the P.R.O.O.F. Strategy. PT Energy, its customers, sites, vendors, people and every figure shown are
          fictional. No industrial system, customer data or payment system is connected. Actions you take here change local demo state only.
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function Header() {
  const { pathname } = useLocation()
  const { period, setPeriod, setMobileNav } = useApp()
  const isDetail = pathname.startsWith('/operations/')
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-[rgb(245_246_248/.72)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 md:px-8">
        <button onClick={() => setMobileNav(true)} className="grid size-9 place-items-center rounded-md text-text-2 hover:text-text-1 md:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
        {isDetail && (
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[14px]">
            <Link to="/operations" className="text-text-2 hover:text-text-1">
              Operations
            </Link>
            <ChevronRight className="size-3.5 text-text-3" />
            <span className="truncate font-semibold text-text-1" aria-current="page">
              {pathname.split('/')[2]}
            </span>
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <PrototypeChip />
          <SegmentedControl
            label="Reporting period"
            value={period}
            onChange={setPeriod}
            options={PERIODS.map((p) => ({ value: p.id, label: p.label, title: p.long }))}
            className="hidden sm:inline-flex"
          />
          <AccountSelector />
        </div>
      </div>
    </header>
  )
}
