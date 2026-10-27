import { motion } from 'motion/react'
import { useState } from 'react'
import { useApp } from '@/app/store'
import { DEMO_TODAY } from '@/data/dates'
import type { RegionId } from '@/data/types'
import { fmtDate } from '@/lib/format'
import { ease } from '@/motion/tokens'
import { KpiStrip } from './KpiStrip'
import { NeedsAttention, ProofFunnel } from './Modules'
import { NetworkCard, RegionalSnapshot } from './NetworkPanel'
import { useOverview } from './useOverview'

export function OverviewPage() {
  const data = useOverview()
  const [region, setRegion] = useState<RegionId | null>(null)
  const customers = useApp((s) => s.dataset.customers)
  const accountName = data.account === 'all' ? 'All accounts' : customers.find((c) => c.id === data.account)!.name

  return (
    <div className="flex flex-col gap-6">
      <motion.section data-tour="overview.hero" className="pt-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <div className="eyebrow">
          {accountName} · {fmtDate(DEMO_TODAY)}
        </div>
        <h1 className="type-display mt-2 text-[32px] leading-[1.1] text-balance md:text-[40px]">
          {data.active.length} active operations across {data.regionsActive} regions.
        </h1>
        <p className="mt-2 text-[17px] text-text-2">
          <span className="font-medium text-amber">{data.open.length} open exceptions</span> · {data.pendingAck.length} awaiting your acknowledgment
        </p>
      </motion.section>

      <KpiStrip data={data} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <NetworkCard regions={data.regions} selected={region} onSelect={setRegion} />
        </div>
        <div className="xl:col-span-4">
          <RegionalSnapshot regions={data.regions} selected={region} onSelect={setRegion} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <NeedsAttention data={data} />
        <ProofFunnel funnel={data.funnel} />
      </div>
    </div>
  )
}
