import { motion } from 'motion/react'
import { useState } from 'react'
import type { RegionId } from '@/data/types'
import { ease } from '@/motion/tokens'
import { KpiStrip } from './KpiStrip'
import { NeedsAttention, ProofFunnel } from './Modules'
import { NetworkCard, RegionalSnapshot } from './NetworkPanel'
import { useOverview } from './useOverview'

export function OverviewPage() {
  const data = useOverview()
  const [region, setRegion] = useState<RegionId | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <motion.section data-tour="overview.hero" className="self-start rounded-[12px]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <h1 className="type-display text-[32px] leading-[1.1] text-balance md:text-[40px]">
          {data.active.length} active operations across {data.regionsActive} regions.
        </h1>
        <p className="mt-2 text-[17px] text-text-2">
          <span className="font-medium text-amber">{data.open.length} open exceptions</span> and {data.pendingAck.length} awaiting your acknowledgment
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
