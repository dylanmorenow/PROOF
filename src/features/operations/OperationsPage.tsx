import { ArrowRight, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useApp } from '@/app/store'
import { activeWorkOrders, evidenceByWorkOrder, progressOf, workOrderProof } from '@/data/selectors'
import type { ActiveStatus, RegionId } from '@/data/types'
import { cx } from '@/lib/cx'
import { fmtDate } from '@/lib/format'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Grow } from '@/ui/Grow'
import { Milestones } from '@/ui/Milestones'
import { ProofSummary } from '@/ui/ProofChain'
import { SegmentedControl } from '@/ui/SegmentedControl'
import { ACTIVE_STATUS_ORDER, PriorityTag, STATUS_META, StatusPill } from '@/ui/Status'

const field = 'h-9 rounded-full border border-line bg-white px-3.5 text-[14px] text-text-1 shadow-[var(--shadow-card)] outline-none focus-visible:ring-2 focus-visible:ring-cyan'

export function OperationsPage() {
  const dataset = useApp((s) => s.dataset)
  const account = useApp((s) => s.account)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState<ActiveStatus | 'all'>('all')
  const [query, setQuery] = useState('')
  const region = (params.get('region') ?? 'all') as RegionId | 'all'
  const selectedId = params.get('wo')

  const active = useMemo(() => activeWorkOrders(dataset, account), [dataset, account])
  const evidence = useMemo(() => evidenceByWorkOrder(dataset), [dataset])
  const inRegion = active.filter((w) => region === 'all' || w.regionId === region)
  const q = query.trim().toLowerCase()
  const rows = inRegion
    .filter((w) => status === 'all' || w.status === status)
    .filter((w) => !q || `${w.id} ${w.title}`.toLowerCase().includes(q))
    .sort((a, b) => a.due.localeCompare(b.due))
  const selected = active.find((w) => w.id === selectedId) ?? null

  const setParam = (key: string, value: string | null) =>
    setParams((p) => {
      if (value) p.set(key, value)
      else p.delete(key)
      return p
    })

  const regionName = (id: RegionId) => dataset.regions.find((r) => r.id === id)!.name

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-display text-[32px] leading-tight">Operations</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-full overflow-x-auto" data-tour="ops.status">
          <SegmentedControl
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all' as const, label: `All ${inRegion.length}` },
              ...ACTIVE_STATUS_ORDER.map((s) => ({ value: s, label: `${STATUS_META[s].short} ${inRegion.filter((w) => w.status === s).length}` })),
            ]}
          />
        </div>
        <select aria-label="Region" value={region} onChange={(e) => setParam('region', e.target.value === 'all' ? null : e.target.value)} className={field}>
          <option value="all">All regions</option>
          {dataset.regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <label className="relative ml-auto">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-3" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search work orders" className={cx(field, 'w-56 pl-9')} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card index={0} tour="ops.table" lens="B" className="xl:col-span-8" bodyClassName="overflow-x-auto">
          <table className="w-full text-left text-[14px] md:min-w-[620px]">
            <thead>
              <tr className="text-[12.5px] text-text-2">
                {['Work order', 'Region', 'Due', 'Evidence', 'Status'].map((h, i) => (
                  <th key={h} className={cx('px-4 py-3 font-medium whitespace-nowrap first:pl-5', i > 0 && i < 4 && 'hidden md:table-cell')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((w, i) => {
                const proof = workOrderProof(evidence.get(w.id) ?? [])
                const isSel = w.id === selectedId
                return (
                  <motion.tr
                    key={w.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i, 14) * 0.025 }}
                    tabIndex={0}
                    aria-selected={isSel}
                    onClick={() => (window.matchMedia('(min-width: 1280px)').matches ? setParam('wo', isSel ? null : w.id) : navigate(`/operations/${w.id}`))}
                    onDoubleClick={() => navigate(`/operations/${w.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && setParam('wo', w.id)}
                    className={cx('cursor-pointer border-t border-line transition-colors outline-none focus-visible:bg-surface-3', isSel ? 'bg-teal-soft' : 'hover:bg-surface-3')}
                  >
                    <td className="py-3 pr-4 pl-5">
                      <div className="font-medium text-text-1">{w.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[12.5px] text-text-2 tabular">
                        <PriorityTag priority={w.priority} />
                        {w.id}
                        <span className="h-1 w-12 overflow-hidden rounded-full bg-black/10">
                          <Grow pct={progressOf(w) * 100} className="block h-full bg-teal" delay={0.2 + Math.min(i, 14) * 0.025} />
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 whitespace-nowrap text-text-2 md:table-cell">{regionName(w.regionId)}</td>
                    <td className="hidden px-4 whitespace-nowrap text-text-2 tabular md:table-cell">{fmtDate(w.due, false)}</td>
                    <td className="hidden px-4 md:table-cell">
                      <ProofSummary {...proof} />
                    </td>
                    <td className="px-4">
                      <StatusPill status={w.status} short />
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div className="py-16 text-center text-[14px] text-text-2">No work orders match</div>}
        </Card>

        <div className="xl:col-span-4">
          <Card index={1} tour="ops.preview" title={selected ? selected.id : 'Work order'} className="xl:sticky xl:top-24">
            <AnimatePresence mode="wait" initial={false}>
              {selected ? (
                <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div className="text-[17px] font-semibold leading-snug">{selected.title}</div>
                  <div className="mt-2">
                    <StatusPill status={selected.status} />
                  </div>
                  <div className="mt-5" data-tour="ops.timeline">
                    <Milestones milestones={selected.milestones} />
                  </div>
                  <Link to={`/operations/${selected.id}`} className="mt-6 block">
                    <Button variant="primary" className="w-full">
                      Open work order <ArrowRight />
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 text-center text-[14px] text-text-2">
                  Select a work order
                </motion.p>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  )
}
