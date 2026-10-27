export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-bg-1 px-1 font-mono text-[10.5px] font-medium text-text-2">
      {children}
    </kbd>
  )
}
