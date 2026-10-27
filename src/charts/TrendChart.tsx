import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { area, curveMonotoneX, line } from 'd3-shape'
import { scaleLinear, scalePoint } from 'd3-scale'
import { useMemo, useState } from 'react'
import type { SeriesPoint } from '@/data/selectors'
import { fmtMonth, fmtPct } from '@/lib/format'
import { useMeasure } from '@/lib/useMeasure'

export interface TrendSeries {
  id: string
  label: string
  color: string
  points: SeriesPoint[]
  area?: boolean
  dashed?: boolean
}

const M = { top: 16, right: 16, bottom: 28, left: 40 }

/** Monthly percentage trend with a target line, crosshair and custom tooltip. */
export function TrendChart({ series, target, height: fixedHeight, domain = [60, 100] }: { series: TrendSeries[]; target?: { value: number; label: string }; height?: number; domain?: [number, number] }) {
  const [ref, measured] = useMeasure<HTMLDivElement>()
  const width = measured.width
  const height = fixedHeight ?? Math.max(measured.height, 220)
  const reduce = useReducedMotion()
  const [hover, setHover] = useState<number | null>(null)
  const months = series[0].points.map((p) => p.month)

  const geo = useMemo(() => {
    const w = Math.max(width, 200)
    const x = scalePoint<string>().domain(months).range([M.left, w - M.right]).padding(0.25)
    const y = scaleLinear().domain(domain).range([height - M.bottom, M.top])
    const paths = series.map((s) => {
      const pts = s.points.filter((p) => p.value != null) as { month: string; value: number }[]
      const l = line<{ month: string; value: number }>().x((p) => x(p.month)!).y((p) => y(p.value)).curve(curveMonotoneX)
      const a = area<{ month: string; value: number }>().x((p) => x(p.month)!).y0(height - M.bottom).y1((p) => y(p.value)).curve(curveMonotoneX)
      return { ...s, line: l(pts) ?? '', area: a(pts) ?? '' }
    })
    return { x, y, paths, w }
  }, [width, months, series, height, domain])

  const ticks = geo.y.ticks(4)

  return (
    <div ref={ref} className="relative h-full min-h-[220px] w-full" style={fixedHeight ? { height: fixedHeight } : undefined}>
      {width > 0 && (
        <svg width={geo.w} height={height} className="absolute inset-0 overflow-visible" role="img" aria-label={`Trend chart: ${series.map((s) => s.label).join(' and ')}`}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.id} id={`trend-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={s.color} stopOpacity=".2" />
                <stop offset="1" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={geo.w - M.right} y1={geo.y(t)} y2={geo.y(t)} stroke="#8EA4B5" strokeOpacity=".09" />
              <text x={M.left - 10} y={geo.y(t)} dy="0.32em" textAnchor="end" className="fill-text-3 tabular" fontSize="10.5">
                {t}%
              </text>
            </g>
          ))}
          {months.map((m, i) => (
            <text key={m} x={geo.x(m)} y={height - 8} textAnchor="middle" className={hover === i ? 'fill-text-1' : 'fill-text-3'} fontSize="10.5">
              {fmtMonth(m)}
            </text>
          ))}
          {target && (
            <g>
              <line x1={M.left} x2={geo.w - M.right} y1={geo.y(target.value)} y2={geo.y(target.value)} stroke="#E9A23B" strokeOpacity=".55" strokeDasharray="3 4" />
              <text x={M.left + 8} y={geo.y(target.value) - 6} textAnchor="start" className="fill-amber" fontSize="10.5" opacity=".85">
                {target.label}
              </text>
            </g>
          )}
          {hover != null && <line x1={geo.x(months[hover])} x2={geo.x(months[hover])} y1={M.top} y2={height - M.bottom} stroke="#8EA4B5" strokeOpacity=".3" />}
          {geo.paths.map((p, i) => (
            <g key={p.id}>
              {p.area && <motion.path d={p.area} fill={`url(#trend-${p.id})`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1, d: p.area }} transition={{ duration: 0.6, delay: 0.5 }} />}
              <motion.path
                d={p.line}
                fill="none"
                stroke={p.color}
                strokeWidth="2"
                strokeDasharray={p.dashed ? '1 0' : undefined}
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1, d: p.line }}
                transition={{ pathLength: { duration: 1.2, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }, d: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
              />
              {hover != null && p.points[hover].value != null && (
                <circle cx={geo.x(months[hover])} cy={geo.y(p.points[hover].value!)} r="4" fill={p.color} stroke="#10233a" strokeWidth="2" />
              )}
            </g>
          ))}
          {months.map((m, i) => {
            const step = (geo.w - M.left - M.right) / months.length
            return (
              <rect
                key={m}
                x={geo.x(m)! - step / 2}
                y={M.top}
                width={step}
                height={height - M.top - M.bottom}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
        </svg>
      )}
      <AnimatePresence>
        {hover != null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0, left: Math.min(Math.max(geo.x(months[hover])! - 90, 0), geo.w - 180) }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className="pointer-events-none absolute top-0 w-[180px] rounded-[10px] border border-line-strong bg-[rgb(22_48_73/.96)] px-3 py-2.5 shadow-[var(--shadow-raised)]"
          >
            <div className="text-[11.5px] font-medium text-text-2">{fmtMonth(months[hover], true)}</div>
            {series.map((s) => (
              <div key={s.id} className="mt-1 flex items-center justify-between gap-3 text-[12.5px]">
                <span className="inline-flex items-center gap-1.5 text-text-2">
                  <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="font-semibold text-text-1 tabular">{fmtPct(s.points[hover].value)}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
