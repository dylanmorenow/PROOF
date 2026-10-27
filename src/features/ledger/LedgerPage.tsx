import { Calculator, Check, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useApp } from '@/app/store'
import { calculateLedger } from '@/data/ledger'
import { contractEvidence } from '@/data/selectors'
import { cx } from '@/lib/cx'
import { fmtUsd } from '@/lib/format'
import { usePip } from '@/pip/pipStore'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { CountUp } from '@/motion/useCountUp'
import { ProofChain } from '@/ui/ProofChain'

const STAGES = ['Calculated', 'Customer review', 'Commercial approval', 'Settlement draft']
const SCALE: [number, number] = [85, 100]
const pos = (pct: number) => `${((pct - SCALE[0]) / (SCALE[1] - SCALE[0])) * 100}%`

export function LedgerPage() {
  const dataset = useApp((s) => s.dataset)
  const [params, setParams] = useSearchParams()
  const contract = dataset.contracts.find((c) => c.id === params.get('c')) ?? dataset.contracts[0]
  const run = params.has('run')
  const records = useMemo(() => contractEvidence(dataset, contract), [dataset, contract])
  const r = useMemo(() => calculateLedger(contract, records), [contract, records])
  const customer = (id: string) => dataset.customers.find((c) => c.id === id)!.name
  const above = r.improvementPts > 0

  useEffect(() => {
    if (run) usePip.getState().react('success', 1200)
  }, [run, contract.id])

  const lines: { label: string; detail?: string; value: number; tour?: string }[] = [
    { label: 'Fixed fee', value: r.fixedFee },
    { label: 'Performance fee', detail: `${r.eligiblePts.toFixed(1)} pp × ${fmtUsd(contract.ratePerPoint)}`, value: r.performanceFee },
    { label: 'Adjustments', value: r.adjustments },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div data-tour="ledger.header" className="flex flex-wrap items-center gap-3 self-start">
        <h1 className="type-display text-[32px] leading-tight">Outcome Ledger</h1>
        <span className="rounded-full bg-amber-soft px-3 py-1 text-[12.5px] font-medium text-amber">Paid-on-Proof concept</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3" role="radiogroup" aria-label="Contract">
        {dataset.contracts.map((c) => {
          const res = calculateLedger(c, contractEvidence(dataset, c))
          const on = c.id === contract.id
          return (
            <button
              key={c.id}
              role="radio"
              aria-checked={on}
              onClick={() => setParams({ c: c.id })}
              className={cx('surface-card p-5 text-left transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] active:scale-[.99]', on ? '!border-teal ring-1 ring-teal' : 'hover:bg-surface-3/60')}
            >
              <div className="text-[15px] font-semibold">{c.name}</div>
              <div className="mt-0.5 text-[13px] text-text-2">{customer(c.customerId)}</div>
              <div className="type-display mt-3 text-[22px] tabular">{fmtUsd(res.total)}</div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="flex flex-col gap-6 xl:col-span-7">
          <Card index={1} lens="X" title="Availability" actions={<span className="text-[13px] text-text-2">{contract.period}</span>}>
            <div className="grid grid-cols-2 gap-6">
              <div data-tour="ledger.baseline">
                <div className="eyebrow">Contract baseline</div>
                <div className="type-display mt-1 text-[32px] tabular">
                  <CountUp value={r.baselinePct} format={(n) => `${n.toFixed(1)}%`} />
                </div>
              </div>
              <div data-tour="ledger.verified">
                <div className="eyebrow">Verified</div>
                <div className={cx('type-display mt-1 text-[32px] tabular', above ? 'text-verified' : 'text-amber')}>
                  <CountUp value={r.verifiedPct} format={(n) => `${n.toFixed(1)}%`} delay={0.15} />
                </div>
              </div>
            </div>
            <div data-tour="ledger.improvement" className="mt-6">
              <div className="relative h-3 rounded-full bg-bg-1">
                <motion.span
                  className={cx('absolute inset-y-0 rounded-full', above ? 'bg-verified/80' : 'bg-amber/70')}
                  initial={false}
                  animate={{ left: pos(Math.min(r.baselinePct, r.verifiedPct)), width: `calc(${pos(Math.max(r.baselinePct, r.verifiedPct))} - ${pos(Math.min(r.baselinePct, r.verifiedPct))})` }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                />
                <span className="absolute -inset-y-1 w-0.5 rounded-full bg-text-1" style={{ left: pos(r.baselinePct) }} />
              </div>
              <div className="mt-2 flex justify-between text-[12.5px] text-text-3 tabular">
                <span>{SCALE[0]}%</span>
                <span className={cx('font-medium', above ? 'text-verified' : 'text-amber')}>
                  {above ? `+${r.improvementPts.toFixed(1)} pp above baseline` : `${Math.abs(r.improvementPts).toFixed(1)} pp below baseline`}
                </span>
                <span>{SCALE[1]}%</span>
              </div>
            </div>
          </Card>

          <Card index={2} tour="ledger.calc" lens="X" title="Fee calculation">
            {!run ? (
              <div className="flex flex-col items-start gap-4">
                <p className="text-[15px] text-text-2">
                  {fmtUsd(contract.fixedFee)} fixed plus {fmtUsd(contract.ratePerPoint)} for every verified point above baseline, up to {contract.capPoints} points.
                </p>
                <Button variant="primary" onClick={() => setParams({ c: contract.id, run: '1' })}>
                  <Calculator /> Run calculation
                </Button>
              </div>
            ) : (
              <ul key={contract.id} className="text-[15px]">
                {lines.map((l, i) => (
                  <motion.li key={l.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.18, duration: 0.3 }} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                    <span>
                      {l.label}
                      {l.detail && <span className="ml-2 text-[13px] text-text-2 tabular">{l.detail}</span>}
                    </span>
                    <span className="tabular">{fmtUsd(l.value)}</span>
                  </motion.li>
                ))}
                <motion.li data-tour="ledger.total" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: lines.length * 0.18, duration: 0.3 }} className="flex items-baseline justify-between gap-4 pt-4">
                  <span className="font-semibold">Draft settlement</span>
                  <span className="type-display text-[28px] tabular">{fmtUsd(r.total)}</span>
                </motion.li>
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6 xl:col-span-5">
          <Card index={3} tour="ledger.approval" lens="X" title="Approval">
            <ol className="flex flex-col gap-4">
              {STAGES.map((s, i) => {
                const done = i < contract.approvalStage || (i === contract.approvalStage && i === STAGES.length - 1)
                const current = i === contract.approvalStage && !done
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span className={cx('grid size-6 shrink-0 place-items-center rounded-full', done ? 'bg-teal text-white' : current ? 'ring-2 ring-teal' : 'ring-1 ring-black/15')}>
                      {done ? <Check className="size-3.5" strokeWidth={3} /> : current && <span className="size-2 rounded-full bg-teal" />}
                    </span>
                    <span className={cx('flex-1 text-[14px]', done || current ? 'font-medium text-text-1' : 'text-text-2')}>{s}</span>
                    {current && <span className="text-[13px] font-medium text-amber">In progress</span>}
                  </li>
                )
              })}
            </ol>
          </Card>

          <Card index={4} tour="ledger.evidence" lens="C" title="Evidence" bodyClassName="px-2 pb-2">
            <ul>
              {records.map((e) => (
                <li key={e.id}>
                  <Link to={`/evidence?id=${e.id}`} className="flex items-center gap-3 rounded-[12px] px-3 py-3 transition-colors hover:bg-surface-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">{e.title}</span>
                      <span className="block text-[12.5px] text-text-2 tabular">
                        {e.id} · {e.measurement!.value} of {e.measurement!.periodHours} h
                      </span>
                    </span>
                    <ProofChain stage={e.stage} />
                    <ChevronRight className="size-4 text-text-3" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-line px-3 pt-3 pb-1 text-[14px] tabular">
              <span className="font-medium">Total</span>
              <span>
                {r.availableHours} of {r.periodHours} h
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
