import * as T from '@radix-ui/react-tooltip'

export const TooltipProvider = T.Provider

export function Tooltip({ content, children, side = 'top' }: { content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <T.Root delayDuration={250}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={8}
          className="z-[60] max-w-64 rounded-[10px] bg-text-1 px-2.5 py-1.5 text-[12px] leading-snug text-white shadow-[var(--shadow-raised)] data-[state=delayed-open]:animate-[tip-in_.16s_var(--ease-out-expo)]"
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  )
}
