import { ArrowLeft, Hexagon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/ui/Button'

function EmptyFrame({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="surface-card relative grid min-h-[60dvh] place-items-center overflow-hidden px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_260px_at_50%_30%,rgb(18_124_145/.14),transparent_70%)]" />
      <div className="relative max-w-md">
        <Hexagon className="mx-auto size-10 text-teal" strokeWidth={1.2} />
        <div className="eyebrow mt-5">{eyebrow}</div>
        <h1 className="type-display mt-2 text-[28px] font-[620] text-text-1">{title}</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-text-2">{body}</p>
        <div className="mt-7 flex justify-center">{children}</div>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <EmptyFrame eyebrow="404 · Not found" title="Nothing verified here" body="This page does not exist in the PROOF Room prototype. Every real page is one click away in the sidebar.">
      <Link to="/">
        <Button variant="primary">
          <ArrowLeft /> Return to Overview
        </Button>
      </Link>
    </EmptyFrame>
  )
}
