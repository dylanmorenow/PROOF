import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useApp } from '@/app/store'
import { Button } from '@/ui/Button'
import { Seal } from '@/ui/Seal'

const MAPPING = [
  { tag: 'Option B', title: 'Archipelago Delivery Resilience', body: 'Regional network view, candidate coordination nodes, supplier qualification status, and milestone-level delivery tracking.', tone: '!text-cyan' },
  { tag: 'Option C', title: 'Digital-First Customer Experience', body: 'The customer workspace itself, with live service tracking, KPI reporting, the Evidence Center and structured customer acknowledgments.', tone: '!text-verified' },
  { tag: 'Independent concept', title: 'Paid-on-Proof Contracts', body: 'The Outcome Ledger. A separate strategic proposal that is not deployed, not funded and not part of the Option C digital investment.', tone: '!text-amber' },
]

export function AboutDialog() {
  const { aboutOpen, setAboutOpen, resetDemo, signOut } = useApp()
  return (
    <Dialog.Root open={aboutOpen} onOpenChange={setAboutOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-[rgb(4_10_18/.7)] backdrop-blur-[3px] data-[state=open]:animate-[tip-in_.2s_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[71] max-h-[86dvh] w-[min(620px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[16px] border border-line-strong bg-surface-1 p-6 shadow-[var(--shadow-raised)] focus:outline-none data-[state=open]:animate-[pop-in_.25s_var(--ease-out-expo)] md:p-8">
          <div className="flex items-start gap-4">
            <Seal size={40} />
            <div className="min-w-0 flex-1">
              <Dialog.Title className="type-display text-[22px] font-[620] text-text-1">About this prototype</Dialog.Title>
              <Dialog.Description className="mt-1 text-[13.5px] leading-relaxed text-text-2">
                PROOF Room shows the product implied by the <span className="text-text-1">P.R.O.O.F. Strategy, From Price-Led Bidding to Proof-Led Growth</span>. It is the command center
                for verifiable energy operations.
              </Dialog.Description>
            </div>
            <Dialog.Close className="grid size-8 shrink-0 place-items-center rounded-md text-text-2 hover:bg-[rgb(142_164_181/.1)] hover:text-text-1" aria-label="Close">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="mt-6 grid gap-3">
            {MAPPING.map((m) => (
              <div key={m.tag} className="rounded-[10px] border border-line bg-bg-1 p-4">
                <div className={`eyebrow ${m.tone}`}>{m.tag}</div>
                <div className="mt-0.5 text-[14px] font-semibold text-text-1">{m.title}</div>
                <p className="mt-1 text-[13px] leading-relaxed text-text-2">{m.body}</p>
              </div>
            ))}
          </div>

          <ul className="mt-6 space-y-2 text-[13px] leading-relaxed text-text-2">
            <li>• PT Energy, its customers, sites, vendors, people and all figures are fictional demonstration data.</li>
            <li>• Batam, Surabaya, Balikpapan and Sorong are proposed candidate coordination nodes, not existing PT Energy facilities.</li>
            <li>• No industrial system, customer data, or payment infrastructure is connected. Actions change local demo state only.</li>
            <li>• Map geography from Natural Earth (public domain).</li>
          </ul>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
            <span className="text-[12px] text-text-3">Press L for the Strategy lens and [ to collapse the sidebar</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={signOut}>
                Sign out
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  resetDemo()
                  setAboutOpen(false)
                }}
              >
                Reset demo data
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
