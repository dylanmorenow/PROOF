/** PROOF seal: a hexagonal crystal seen from above, with a verification notch. Same geometry as PIP. */
export function Seal({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="seal-core" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#76CFDA" stopOpacity=".9" />
          <stop offset="1" stopColor="#127C91" stopOpacity=".55" />
        </linearGradient>
      </defs>
      <path d="M16 2.8 27.4 9.4v13.2L16 29.2 4.6 22.6V9.4Z" fill="none" stroke="#76CFDA" strokeOpacity=".9" strokeWidth="1.4" />
      <path d="M16 8.4 22.6 12.2v7.6L16 23.6l-6.6-3.8v-7.6Z" fill="url(#seal-core)" />
      <path d="M16 2.8v5.6M27.4 9.4l-4.8 2.8M4.6 9.4l4.8 2.8" stroke="#76CFDA" strokeOpacity=".35" strokeWidth="1" />
      <path d="m12.9 16.1 2.2 2.2 4.2-4.4" fill="none" stroke="#F7FAFC" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
