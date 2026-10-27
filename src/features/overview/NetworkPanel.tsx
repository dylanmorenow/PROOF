import { ArrowUpRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'
import { useApp } from '@/app/store'
import type { RegionSummary } from '@/data/selectors'
import type { RegionId } from '@/data/types'
import { IndonesiaMap } from '@/features/network-map/IndonesiaMap'
import { cx } from '@/lib/cx'
import { fmtPct } from '@/lib/format'
import { Card } from '@/ui/Card'

interface Props {
  regions: RegionSummary[]
  selected: RegionId | null
  onSelect: (r: RegionId | null) => void
}

export function NetworkCard({ regions, selected, onSelect }: Props) {
  const ref = useApp((s) => s.dataset.regions)
  return (
    <Card
      index={5}
      tour="overview.map"
      lens="B"
      title="Regional network"
      bodyClassName="px-3 pb-4 sm:px-5"
    >
      <IndonesiaMap regions={ref} summaries={regions} selected={selected} onSelect={onSelect} />
    </Card>
  )
}

export function RegionalSnapshot({ regions, selected, onSelect }: Props) {
  const dataset = useApp((s) => s.dataset)
  const region = selected ? dataset.regions.find((r) => r.id === selected)! : null
  const summary = selected ? regions.find((r) => r.regionId === selected)! : null

  return (
    <Card index={6} tour="overview.snapshot" lens="B" title={region ? region.name : 'By region'} className="h-full">
      <AnimatePresence mode="wait" initial={false}>
        {!region || !summary ? (
          <motion.ul key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="-mx-2 flex flex-col">
            {regions.map((r) => {
              const meta = dataset.regions.find((x) => x.id === r.regionId)!
              return (
                <li key={r.regionId}>
                  <button onClick={() => onSelect(r.regionId)} className="flex w-full items-center gap-3 rounded-[12px] px-2 py-3 text-left transition-colors hover:bg-surface-3 active:bg-bg-1">
                    <span className="flex-1 text-[14px] font-medium text-text-1">{meta.name}</span>
                    <span className="text-right">
                      <span className="block text-[15px] font-semibold text-text-1 tabular">{r.active}</span>
                      <span className="block text-[12px] text-text-3 tabular">{fmtPct(r.otd.pct, 0)} on time</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </motion.ul>
        ) : (
          <motion.div key={region.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex h-full flex-col">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
              <Metric label="Active operations" value={String(summary.active)} />
              <Metric label="On-time delivery" value={fmtPct(summary.otd.pct)} />
              <Metric label="Evidence verified" value={fmtPct(summary.evidence.pct)} />
              <Metric label="Open exceptions" value={String(summary.openExceptions)} warn={summary.openExceptions > 0} />
              <Metric label="Vendors qualified" value={`${summary.vendorsQualified} of ${summary.vendorsTotal}`} />
            </dl>
            <div className="mt-auto flex items-center justify-between pt-6">
              <button onClick={() => onSelect(null)} className="text-[13px] font-medium text-text-2 hover:text-text-1">
                All regions
              </button>
              <Link to={`/operations?region=${region.id}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-cyan hover:underline">
                View operations <ArrowUpRight className="size-3.5" />
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
    <div>
      <dt className="text-[12.5px] text-text-2">{label}</dt>
      <dd className={cx('type-display mt-0.5 text-[22px] tabular', warn ? 'text-amber' : 'text-text-1')}>{value}</dd>
    </div>
  )
}
