import { motion } from 'motion/react'
import { useState } from 'react'
import { useApp } from '@/app/store'
import { TrendChart } from '@/charts/TrendChart'
import { DEMO_TODAY } from '@/data/dates'
import { PERIODS } from '@/data/selectors'
import type { RegionId } from '@/data/types'
import { fmtDate } from '@/lib/format'
import { ease } from '@/motion/tokens'
import { Card } from '@/ui/Card'
import { KpiStrip } from './KpiStrip'
import { ActivityFeed, NeedsAttention, ProofFunnel } from './Modules'
import { NetworkCard, RegionalSnapshot } from './NetworkPanel'
import { useOverview } from './useOverview'

export function OverviewPage() {
  const data = useOverview()
  const [region, setRegion] = useState<RegionId | null>(null)
  const customers = useApp((s) => s.dataset.customers)
  const accountName = data.account === 'all' ? 'All accounts' : customers.find((c) => c.id === data.account)!.name
  const periodLabel = PERIODS.find((p) => p.id === data.period)!.long

  return (
    <div className="flex flex-col gap-6">
      <section data-tour="overview.hero" className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pt-1">
        <div className="min-w-0">
          <motion.div className="eyebrow flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex size-1.5 rounded-full bg-verified shadow-[0_0_8px_#4FBF8B]" />
            Command summary · {accountName} · {fmtDate(DEMO_TODAY)}, 09:00 WIB
          </motion.div>
          <motion.h1
            className="type-display mt-3 text-[30px] leading-[1.12] font-[600] text-balance text-text-1 md:text-[38px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            {data.active.length} active operations across {data.regionsActive} regions.
          </motion.h1>
          <motion.p className="mt-1.5 text-[17px] text-text-2 md:text-[19px]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08, ease }}>
            <span className="text-amber">{data.open.length} open exceptions</span>
            <span className="mx-2 text-text-3">·</span>
            <span className="text-text-1">{data.pendingAck.length} awaiting your acknowledgment</span>
          </motion.p>
        </div>
        <motion.div className="text-right text-[12px] text-text-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          Reporting period
          <div className="text-[13px] font-medium text-text-1">{periodLabel}</div>
        </motion.div>
      </section>

      <KpiStrip data={data} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <NetworkCard regions={data.regions} selected={region} onSelect={setRegion} />
        </div>
        <div className="xl:col-span-4">
          <RegionalSnapshot regions={data.regions} selected={region} onSelect={setRegion} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card
          index={7}
          tour="overview.trend"
          lens="C"
          eyebrow="Service performance"
          title="Delivery and service-level trend"
          className="xl:col-span-8"
          bodyClassName="flex-1 px-5 pb-4"
          actions={
            <div className="hidden items-center gap-4 text-[11.5px] text-text-2 sm:flex">
              <Legend color="#76CFDA" label="On-time delivery" />
              <Legend color="#A9C2D3" label="SLA attainment" />
              <span className="text-text-3">Monthly</span>
            </div>
          }
        >
          <TrendChart
            series={[
              { id: 'otd', label: 'On-time delivery', color: '#76CFDA', points: data.trend.otd, area: true },
              { id: 'sla', label: 'SLA attainment', color: '#A9C2D3', points: data.trend.sla },
            ]}
            target={{ value: 90, label: 'Target 90%' }}
          />
        </Card>
        <div className="xl:col-span-4">
          <NeedsAttention data={data} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <ProofFunnel funnel={data.funnel} stats={data.verifyStats} />
        </div>
        <div className="xl:col-span-4">
          <ActivityFeed data={data} />
        </div>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 tabular">
      <span className="h-0.5 w-3.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}
