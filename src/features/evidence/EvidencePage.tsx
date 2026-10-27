import { CircleCheck, FileText, Image, ChartLine, RotateCcw, ShieldCheck } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useApp } from '@/app/store'
import { scopeEvidence } from '@/data/selectors'
import type { EvidenceRecord, ProofStage } from '@/data/types'
import { cx } from '@/lib/cx'
import { fmtDate, fmtSize, fmtStamp } from '@/lib/format'
import { usePip } from '@/pip/pipStore'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { ProofChain } from '@/ui/ProofChain'
import { SegmentedControl } from '@/ui/SegmentedControl'

type Tab = 'submitted' | 'recapture' | 'verified' | 'acknowledged' | 'all'

const TABS: { value: Tab; label: string }[] = [
  { value: 'submitted', label: 'To verify' },
  { value: 'recapture', label: 'Re-capture' },
  { value: 'verified', label: 'Verified' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'all', label: 'All' },
]

const PAGE = 15
const when = (e: EvidenceRecord) => e.uploadedAt ?? e.capturedAt

export function EvidencePage() {
  const dataset = useApp((s) => s.dataset)
  const account = useApp((s) => s.account)
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('id')
  const records = useMemo(() => scopeEvidence(dataset, account).slice().sort((a, b) => when(b).localeCompare(when(a))), [dataset, account])
  const selected = records.find((e) => e.id === selectedId) ?? null
  const [tab, setTab] = useState<Tab>(() => (selected && selected.stage !== 'captured' ? (selected.stage as Tab) : 'submitted'))
  const [limit, setLimit] = useState(PAGE)
  const count = (t: Tab) => (t === 'all' ? records.length : records.filter((e) => e.stage === t).length)
  const list = tab === 'all' ? records : records.filter((e) => e.stage === tab)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-display text-[32px] leading-tight">Evidence</h1>

      <div className="max-w-full overflow-x-auto" data-tour="ev.tabs">
        <SegmentedControl
          label="Evidence status"
          value={tab}
          onChange={(t) => {
            setTab(t)
            setLimit(PAGE)
          }}
          options={TABS.map((t) => ({ value: t.value, label: `${t.label} ${count(t.value)}` }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card index={0} tour="ev.list" lens="C" className="xl:col-span-5" bodyClassName="px-2 pb-2 pt-2">
          {list.length === 0 ? (
            <p className="py-16 text-center text-[14px] text-text-2">Nothing here</p>
          ) : (
            <ul>
              {list.slice(0, limit).map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => setParams({ id: e.id })}
                    aria-pressed={e.id === selectedId}
                    className={cx('flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left transition-colors', e.id === selectedId ? 'bg-teal-soft' : 'hover:bg-surface-3')}
                  >
                    <TypeIcon e={e} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-text-1">{e.title}</span>
                      <span className="block text-[12.5px] text-text-2 tabular">
                        {e.workOrderId ?? e.contractId} · {fmtDate(when(e), false)}
                      </span>
                    </span>
                    <ProofChain stage={e.stage} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {list.length > limit && (
            <div className="p-2">
              <Button variant="ghost" className="w-full" onClick={() => setLimit((l) => l + PAGE)}>
                Show more
              </Button>
            </div>
          )}
        </Card>

        <div className="xl:col-span-7">
          <div className="xl:sticky xl:top-24">
            <AnimatePresence mode="wait" initial={false}>
              {selected ? (
                <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <RecordPanel e={selected} />
                </motion.div>
              ) : (
                <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-card grid h-80 place-items-center text-[14px] text-text-2">
                  Select a record
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

function TypeIcon({ e }: { e: EvidenceRecord }) {
  const Icon = e.type === 'photo-set' ? Image : e.type === 'sensor-log' || e.type === 'availability-log' || e.type === 'measurement' ? ChartLine : FileText
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-bg-1 text-text-2">
      <Icon className="size-4" />
    </span>
  )
}

function RecordPanel({ e }: { e: EvidenceRecord }) {
  const { verifyEvidence, requestRecapture, acknowledgeEvidence } = useApp()
  const react = usePip((s) => s.react)
  const facts: [string, React.ReactNode][] = [
    ['Captured', fmtStamp(e.capturedAt)],
    ['Uploaded', e.uploadedAt ? fmtStamp(e.uploadedAt) : 'Not yet'],
    ['Verified', e.verifiedAt ? fmtStamp(e.verifiedAt) : 'Not yet'],
    ['Acknowledged', e.acknowledgedAt ? fmtStamp(e.acknowledgedAt) : 'Not yet'],
    ['Source', e.source],
    ['Verifier', e.verifier ?? 'Not assigned'],
    ['Checksum', <span className="font-mono text-[12.5px]">{e.checksum}</span>],
    ['Size', fmtSize(e.sizeKb)],
  ]
  if (e.measurement) facts.splice(4, 0, [e.measurement.label, `${e.measurement.value} of ${e.measurement.periodHours} h`])

  return (
    <div className="surface-card overflow-hidden" data-tour="ev.record">
      <Preview e={e} />
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[20px] font-semibold tracking-[-0.015em]">{e.title}</h2>
            <div className="mt-1 text-[13px] text-text-2 tabular">
              {e.id} ·{' '}
              {e.workOrderId ? (
                <Link to={`/operations/${e.workOrderId}`} className="text-cyan hover:underline">
                  {e.workOrderId}
                </Link>
              ) : (
                e.contractId
              )}
            </div>
          </div>
          <ProofChain stage={e.stage} showLabel />
        </div>

        {(e.stage === 'submitted' || e.stage === 'verified') && (
          <div className="mt-5 flex flex-wrap gap-2" data-tour="ev.actions">
            {e.stage === 'submitted' && (
              <>
                <Button variant="primary" onClick={() => (verifyEvidence(e.id), react('success'))}>
                  <ShieldCheck /> Verify
                </Button>
                <Button onClick={() => (requestRecapture(e.id), react('unavailable'))}>
                  <RotateCcw /> Request re-capture
                </Button>
              </>
            )}
            {e.stage === 'verified' && (
              <Button variant="primary" onClick={() => (acknowledgeEvidence(e.id), react('success'))}>
                <CircleCheck /> Acknowledge
              </Button>
            )}
          </div>
        )}

        <dl className="mt-6 grid grid-cols-[120px_1fr] gap-x-3 gap-y-2.5 text-[14px]">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-text-2">{k}</dt>
              <dd className="min-w-0 truncate text-text-1 tabular">{v}</dd>
            </div>
          ))}
        </dl>

        {e.versions.length > 0 && (
          <div className="mt-6" data-tour="ev.versions">
            <h3 className="text-[15px] font-semibold">Versions</h3>
            <ul className="mt-2">
              {e.versions
                .slice()
                .reverse()
                .map((v) => (
                  <li key={v.version} className="flex items-baseline gap-3 border-t border-line py-2.5 text-[14px] first:border-0">
                    <span className="w-8 shrink-0 font-medium">v{v.version}</span>
                    <span className="flex-1 text-text-2">{v.note}</span>
                    <span className={cx('shrink-0 text-[13px] font-medium', v.outcome === 'verified' ? 'text-verified' : v.outcome === 'rejected' ? 'text-amber' : 'text-text-3')}>
                      {v.outcome === 'verified' ? 'Verified' : v.outcome === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

const STAGE_TINT: Record<ProofStage, string> = {
  captured: 'from-[#eef1f4] to-[#e3e8ed]',
  submitted: 'from-[#e8f3f5] to-[#d6eaee]',
  recapture: 'from-[#fbf1e3] to-[#f5e3c8]',
  verified: 'from-[#e7f4ec] to-[#d4ebdd]',
  acknowledged: 'from-[#e7f4ec] to-[#d4ebdd]',
}

/** A simple rendered preview of the record so the panel reads like a document viewer. */
function Preview({ e }: { e: EvidenceRecord }) {
  const photos = e.type === 'photo-set'
  return (
    <div className={cx('flex h-48 items-center justify-center bg-gradient-to-br', STAGE_TINT[e.stage])}>
      {photos ? (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="size-16 rounded-[8px] bg-[radial-gradient(circle_at_40%_40%,#9fd3dc,#2b6f7d_70%,#173f4a)] shadow-sm" style={{ filter: `hue-rotate(${i * 8}deg) brightness(${0.9 + (i % 3) * 0.08})` }} />
          ))}
        </div>
      ) : (
        <div className="h-36 w-28 rounded-[6px] bg-white p-3 shadow-[var(--shadow-raised)]">
          <div className="h-2 w-14 rounded-full bg-teal/70" />
          {[80, 92, 70, 88, 60, 84, 76].map((w, i) => (
            <div key={i} className="mt-2 h-1.5 rounded-full bg-black/10" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
    </div>
  )
}
