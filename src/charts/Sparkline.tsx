import { motion, useReducedMotion } from 'motion/react'
import { area, curveMonotoneX, line } from 'd3-shape'
import { scaleLinear } from 'd3-scale'
import { useId, useMemo } from 'react'

/** Minimal trend line with soft area fill; the last point is marked. */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  color = '#76CFDA',
  delay = 0,
  domain,
}: {
  values: (number | null)[]
  width?: number
  height?: number
  color?: string
  delay?: number
  domain?: [number, number]
}) {
  const id = useId()
  const reduce = useReducedMotion()
  const { linePath, areaPath, last } = useMemo(() => {
    const pts = values.map((v, i) => [i, v] as const).filter((p): p is readonly [number, number] => p[1] != null)
    const ys = pts.map((p) => p[1])
    const [lo, hi] = domain ?? [Math.min(...ys), Math.max(...ys)]
    const pad = (hi - lo || 1) * 0.15
    const x = scaleLinear().domain([0, values.length - 1]).range([2, width - 3])
    const y = scaleLinear().domain([lo - pad, hi + pad]).range([height - 2, 2])
    const l = line<readonly [number, number]>().x((p) => x(p[0])).y((p) => y(p[1])).curve(curveMonotoneX)
    const a = area<readonly [number, number]>().x((p) => x(p[0])).y0(height).y1((p) => y(p[1])).curve(curveMonotoneX)
    const lp = pts[pts.length - 1]
    return { linePath: l(pts) ?? '', areaPath: a(pts) ?? '', last: lp ? { x: x(lp[0]), y: y(lp[1]) } : null }
  }, [values, width, height, domain])

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={areaPath} fill={`url(#spark-${id})`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: delay + 0.4 }} />
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      />
      {last && (
        <motion.circle
          cx={last.x}
          cy={last.y}
          r="2.5"
          fill={color}
          stroke="#10233a"
          strokeWidth="1.5"
          initial={reduce ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.85, type: 'spring', stiffness: 400, damping: 20 }}
        />
      )}
    </svg>
  )
}
