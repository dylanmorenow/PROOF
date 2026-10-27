import { cx } from '@/lib/cx'
import type { PipMood } from './pipStore'

const CORE: Record<PipMood, string> = {
  idle: '#76CFDA',
  attentive: '#9be4ec',
  guiding: '#9be4ec',
  success: '#4FBF8B',
  unavailable: '#8EA4B5',
  celebrating: '#c9f3f7',
}

/**
 * 2D PIP: the same double-terminated hexagonal crystal, five-segment halo and luminous core as the 3D model.
 * Used while the 3D chunk loads, without WebGL, on low-power devices and with reduced motion.
 */
export function PipFallback({ mood, progress, size = 112 }: { mood: PipMood; progress: number; size?: number }) {
  const core = CORE[mood]
  const lit = Math.round(progress * 5)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={cx('motion-safe:[animation:pip-float_4s_ease-in-out_infinite]', mood === 'unavailable' && 'opacity-80 saturate-50')}
    >
      <defs>
        <radialGradient id="pip2d-core">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".35" stopColor={core} />
          <stop offset="1" stopColor={core} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pip2d-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bff0f5" stopOpacity=".55" />
          <stop offset="1" stopColor="#127C91" stopOpacity=".25" />
        </linearGradient>
        <linearGradient id="pip2d-right" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#76CFDA" stopOpacity=".28" />
          <stop offset="1" stopColor="#0b3a48" stopOpacity=".55" />
        </linearGradient>
      </defs>
      {/* halo — back half */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={`b${i}`}
          d={arcPath(i, true)}
          fill="none"
          stroke={i < lit ? core : '#76CFDA'}
          strokeOpacity={i < lit ? 0.9 : 0.28}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
      {/* crystal facets */}
      <path d="M60 14 80 42v36L60 106Z" fill="url(#pip2d-right)" />
      <path d="M60 14 40 42v36L60 106Z" fill="url(#pip2d-left)" />
      <path d="M60 14 80 42v36L60 106 40 78V42Z" fill="none" stroke="#9be4ec" strokeOpacity=".75" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M60 14v92M40 42l20 6 20-6M40 78l20-6 20 6" fill="none" stroke="#9be4ec" strokeOpacity=".3" strokeWidth=".9" />
      <circle cx="60" cy="60" r="22" fill="url(#pip2d-core)" opacity=".9" />
      <circle cx="60" cy="60" r="6" fill="#ffffff" />
      <circle cx="63" cy="57.5" r="1.8" fill="#081522" opacity=".55" />
      {/* halo — front half */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={`f${i}`}
          d={arcPath(i, false)}
          fill="none"
          stroke={i < lit ? core : '#76CFDA'}
          strokeOpacity={i < lit ? 1 : 0.55}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

/** One of five halo segments, drawn as an ellipse arc split into its back (behind crystal) or front half. */
function arcPath(i: number, back: boolean) {
  const cx = 60
  const cy = 62
  const rx = 44
  const ry = 11
  const seg = (Math.PI * 2) / 5
  const gap = 0.16
  let a0 = i * seg + gap / 2 - Math.PI / 2
  let a1 = (i + 1) * seg - gap / 2 - Math.PI / 2
  // Clip the arc to the visible half: back = upper half (sin < 0), front = lower half.
  const lo = back ? -Math.PI : 0
  const hi = back ? 0 : Math.PI
  const norm = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
  a0 = norm(a0)
  a1 = norm(a1)
  if (a1 < a0) a1 += Math.PI * 2
  const pts: string[] = []
  for (let t = a0; t <= a1 + 1e-6; t += 0.05) {
    const n = norm(t)
    if (n >= lo && n <= hi) pts.push(`${(cx + rx * Math.cos(t)).toFixed(1)},${(cy + ry * Math.sin(t)).toFixed(1)}`)
  }
  return pts.length > 1 ? `M${pts.join('L')}` : ''
}
