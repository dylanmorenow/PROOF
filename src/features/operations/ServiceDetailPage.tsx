import { ChevronRight, CircleCheck, TriangleAlert } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useApp } from '@/app/store'
import type { EvidenceRecord } from '@/data/types'
import { NotFoundPage } from '@/pages/PlaceholderPage'
import { usePip } from '@/pip/pipStore'
import { cx } from '@/lib/cx'
import { fmtDate, fmtRelative } from '@/lib/format'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Milestones } from '@/ui/Milestones'
import { ProofChain } from '@/ui/ProofChain'
import { PriorityTag, QualificationBadge, StatusPill } from '@/ui/Status'

export function ServiceDetailPage() {
  const { id } = useParams()
  const dataset = useApp((s) => s.dataset)
  const acknowledge = useApp((s) => s.acknowledgeWorkOrder)
  const wo = dataset.workOrders.find((w) => w.id === id)
  if (!wo) return <NotFoundPage />

  const customer = dataset.customers.find((c) => c.id === wo.customerId)!
  const site = dataset.sites.find((s) => s.id === wo.siteId)!
  const region = dataset.regions.find((r) => r.id === wo.regionId)!
  const crew = dataset.crews.find((c) => c.id === wo.crewId)!
  const vendor = dataset.vendors.find((v) => v.id === wo.vendorId)
  const records = dataset.evidence.filter((e) => e.workOrderId === wo.id).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
  const exceptions = dataset.exceptions.filter((x) => x.workOrderId === wo.id).sort((a, b) => b.raisedOn.localeCompare(a.raisedOn))
  const pendingAck = wo.status === 'pending-ack'

  return (
    <div className="flex flex-col gap-6">
      <section data-tour="detail.header" className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <StatusPill status={wo.status} />
            <PriorityTag priority={wo.priority} />
          </div>
          <h1 className="type-display mt-2 text-[30px] leading-tight text-balance md:text-[34px]">{wo.title}</h1>
        </div>
        {pendingAck && (
          <Button
            variant="primary"
            data-tour="detail.acknowledge"
            onClick={() => {
              acknowledge(wo.id)
              usePip.getState().react('success')
            }}
          >
            <CircleCheck /> Acknowledge service
          </Button>
        )}
        {wo.status === 'completed' && (
          <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-verified">
            <CircleCheck className="size-4" /> Acknowledged {wo.completedOn && fmtDate(wo.completedOn)}
          </span>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="flex flex-col gap-6 xl:col-span-4">
          <Card index={0} tour="detail.facts" lens="B" title="Delivery">
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-3 text-[14px]">
              <Fact label="Customer">{customer.name}</Fact>
              <Fact label="Site">{site.name}</Fact>
              <Fact label="Region">
                {region.name} <span className="text-text-3">{region.timezone}</span>
              </Fact>
              <Fact label="Crew">
                {crew.name} <span className="text-text-3">{crew.lead}</span>
              </Fact>
              {vendor && (
                <Fact label="Vendor">
                  <span className="flex flex-wrap items-center gap-2">
                    {vendor.name} <QualificationBadge status={vendor.qualification} />
                  </span>
                </Fact>
              )}
              <Fact label="Due">{fmtDate(wo.due)}</Fact>
            </dl>
          </Card>
          <Card index={1} tour="detail.timeline" lens="B" title="Milestones">
            <Milestones milestones={wo.milestones} />
          </Card>
        </div>

        <div className="flex flex-col gap-6 xl:col-span-8">
          <Card index={2} tour="detail.evidence" lens="C" title="Evidence" actions={<span className="text-[13px] text-text-2 tabular">{records.length}</span>} bodyClassName="px-2 pb-2">
            {records.length ? (
              <ul>
                {records.map((e) => (
                  <EvidenceRow key={e.id} e={e} />
                ))}
              </ul>
            ) : (
              <p className="px-3 py-10 text-center text-[14px] text-text-2">No evidence yet</p>
            )}
          </Card>

          <Card index={3} tour="detail.exceptions" lens="C" title="Exceptions" bodyClassName="px-2 pb-2">
            {exceptions.length ? (
              <ul>
                {exceptions.map((x) => (
                  <li key={x.id} className="flex gap-3 rounded-[12px] px-3 py-3">
                    <span className={cx('mt-0.5 grid size-8 shrink-0 place-items-center rounded-full', x.status === 'resolved' ? 'bg-verified-soft text-verified' : 'bg-amber-soft text-amber')}>
                      {x.status === 'resolved' ? <CircleCheck className="size-4" /> : <TriangleAlert className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-[14px] font-medium text-text-1">{x.title}</span>
                        <span className="shrink-0 text-[12.5px] text-text-3">{x.status === 'resolved' ? 'Resolved' : fmtRelative(x.raisedOn)}</span>
                      </span>
                      <span className="mt-1 block text-[13.5px] text-text-2">{x.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-10 text-center text-[14px] text-text-2">No exceptions</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-text-2">{label}</dt>
      <dd className="min-w-0 text-text-1">{children}</dd>
    </>
  )
}

function EvidenceRow({ e }: { e: EvidenceRecord }) {
  return (
    <li>
      <Link to={`/evidence?id=${e.id}`} className="flex items-center gap-4 rounded-[12px] px-3 py-3 transition-colors hover:bg-surface-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-text-1">{e.title}</span>
          <span className="block text-[12.5px] text-text-2 tabular">
            {e.id} · {fmtDate(e.capturedAt, false)}
          </span>
        </span>
        <ProofChain stage={e.stage} showLabel />
        <ChevronRight className="size-4 text-text-3" />
      </Link>
    </li>
  )
}
