import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'
import { useApp } from '@/app/store'
import type { RegionSummary } from '@/data/selectors'
import type { RegionId } from '@/data/types'
import { IndonesiaMap } from '@/features/network-map/IndonesiaMap'
import { cx } from '@/lib/cx'
import { fmtPct } from '@/lib/format'
import { Card } from '@/ui/Card'
import { ACTIVE_STATUS_ORDER, STATUS_META, toneDot } from '@/ui/Status'

export function NetworkCard({ regions, selected, onSelect }: { regions: RegionSummary[]; selected: RegionId | null; onSelect: (r: RegionId | null) => void }) {
  const ref = useApp((s) => s.dataset.regions)
  return (
    <Card
      index={5}
      tour="overview.map"
      lens="B"
      eyebrow="Archipelago network"
      title="Regional operations"
      className="overflow-hidden"
      bodyClassName="px-2 pb-3 sm:px-4"
      actions={
        <div className="hidden items-center gap-4 text-[11.5px] text-text-2 sm:flex">
          <span className="inline-flex items-center gap-1.5">
            <span className="grid size-3 place-items-center rounded-full border border-cyan/70">
              <span className="size-1.5 rounded-full bg-cyan" />
            </span>
            Candidate coordination node
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="22" height="6" aria-hidden="true">
              <path d="M1 3h20" stroke="#76CFDA" strokeOpacity=".7" strokeDasharray="2 4" strokeLinecap="round" />
            </svg>
            Proposed link
          </span>
        </div>
      }
    >
      <IndonesiaMap regions={ref} summaries={regions} selected={selected} onSelect={onSelect} />
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1 text-[11px] text-text-3">
        <span>Nodes are proposed under Option B and are not existing PT Energy facilities. Links show coordination only — no routes or transit times.</span>
        <span>Geography: Natural Earth</span>
      </div>
    </Card>
  )
}

export function RegionalSnapshot({ regions, selected, onSelect }: { regions: RegionSummary[]; selected: RegionId | null; onSelect: (r: RegionId | null) => void }) {
  const dataset = useApp((s) => s.dataset)
  const region = selected ? dataset.regions.find((r) => r.id === selected)! : null
  const summary = selected ? regions.find((r) => r.regionId === selected)! : null
  const maxActive = Math.max(...regions.map((r) => r.active), 1)

  return (
    <Card index={6} tour="overview.snapshot" lens="B" eyebrow={region ? 'Selected node' : 'Network summary'} title={region ? `${region.name} · ${region.area}` : 'All candidate nodes'} className="h-full">
      <AnimatePresence mode="wait" initial={false}>
        {!region || !summary ? (
          <motion.div key="all" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            <p className="mb-4 text-[12.5px] leading-relaxed text-text-2">Select a node on the map to see its regional picture.</p>
            <ul className="flex flex-col">
              {regions.map((r) => {
                const meta = dataset.regions.find((x) => x.id === r.regionId)!
                return (
                  <li key={r.regionId}>
                    <button
                      onClick={() => onSelect(r.regionId)}
                      className="group -mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-[8px] px-2 py-2.5 text-left transition-colors hover:bg-[rgb(142_164_181/.07)]"
                    >
                      <span className="w-24 shrink-0">
                        <span className="block text-[13px] font-medium text-text-1">{meta.name}</span>
                        <span className="block font-mono text-[10.5px] text-text-3">{meta.timezone}</span>
                      </span>
                      <span className="flex flex-1 items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgb(142_164_181/.12)]">
                          <motion.span
                            className="block h-full rounded-full bg-[linear-gradient(90deg,#127C91,#76CFDA)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${(r.active / maxActive) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </span>
                        <span className="w-6 text-right text-[13px] font-semibold text-text-1 tabular">{r.active}</span>
                      </span>
                      <span className="w-14 text-right text-[12px] text-text-2 tabular">{fmtPct(r.otd.pct, 0)}</span>
                      <ArrowRight className="size-3.5 text-text-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-2 flex justify-end gap-6 pr-6 text-[10.5px] tracking-wide text-text-3 uppercase">
              <span>Active</span>
              <span>On time</span>
            </div>
          </motion.div>
        ) : (
          <motion.div key={region.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="flex h-full flex-col">
            <p className="text-[12.5px] leading-relaxed text-text-2">{region.role}</p>
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line">
              <Metric label="Active operations" value={String(summary.active)} />
              <Metric label="On-time delivery" value={fmtPct(summary.otd.pct)} />
              <Metric label="Verified ≤ 48 h" value={fmtPct(summary.evidence.pct)} />
              <Metric label="Open exceptions" value={String(summary.openExceptions)} warn={summary.openExceptions > 0} />
            </div>
            <div className="mt-4">
              <div className="eyebrow mb-2">Status mix</div>
              <div className="flex h-2 gap-[2px] overflow-hidden rounded-full">
                {ACTIVE_STATUS_ORDER.map((s) =>
                  summary.byStatus[s] ? <span key={s} className={cx('h-full', toneDot[STATUS_META[s].tone])} style={{ flexGrow: summary.byStatus[s] }} title={`${STATUS_META[s].label}: ${summary.byStatus[s]}`} /> : null,
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-text-2">
                {ACTIVE_STATUS_ORDER.filter((s) => summary.byStatus[s]).map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5">
                    <span className={cx('size-1.5 rounded-full', toneDot[STATUS_META[s].tone])} />
                    {summary.byStatus[s]} {STATUS_META[s].label.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-[8px] border border-line bg-bg-1 px-3 py-2.5 text-[12.5px]">
              <span className="text-text-2">Local vendors qualified</span>
              <span className="font-medium text-text-1 tabular">
                {summary.vendorsQualified} of {summary.vendorsTotal}
              </span>
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 pt-4">
              <button onClick={() => onSelect(null)} className="text-[12.5px] text-text-2 hover:text-text-1">
                ← All nodes
              </button>
              <Link to={`/operations?region=${region.id}`} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-cyan hover:underline">
                View {summary.active} operations <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="bg-surface-1 px-3 py-3">
      <div className={cx('type-display text-[20px] font-[600] tabular', warn ? 'text-amber' : 'text-text-1')}>{value}</div>
      <div className="mt-0.5 text-[11.5px] text-text-2">{label}</div>
    </div>
  )
}
