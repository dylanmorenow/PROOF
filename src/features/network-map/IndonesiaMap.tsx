import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import type { RegionSummary } from '@/data/selectors'
import type { Region, RegionId } from '@/data/types'
import { cx } from '@/lib/cx'
import { fmtPct } from '@/lib/format'
import { GRATICULE_PATH, INDONESIA_PATH, LAT_TICKS, LON_TICKS, MAP_HEIGHT, MAP_WIDTH, NEIGHBOURS_PATH, NODE_POSITIONS } from './geo.generated'

const W = MAP_WIDTH
const H = MAP_HEIGHT

type NodePos = (typeof NODE_POSITIONS)[number]
const pos = (id: RegionId) => NODE_POSITIONS.find((n) => n.id === id)! as NodePos

/** Proposed coordination links between candidate nodes. Drawn as arcs; no routes or timings are implied. */
const LINKS: [RegionId, RegionId][] = [
  ['batam', 'surabaya'],
  ['batam', 'balikpapan'],
  ['surabaya', 'balikpapan'],
  ['balikpapan', 'sorong'],
]

function arc(a: NodePos, b: NodePos) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  const bend = Math.min(70, len * 0.22)
  // Bend perpendicular to the link, always upward on screen.
  let nx = -dy / len
  let ny = dx / len
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }
  return `M${a.x},${a.y} Q${mx + nx * bend},${my + ny * bend} ${b.x},${b.y}`
}

// Label offsets keep names clear of coastlines.
const LABEL: Record<RegionId, { dx: number; dy: number; anchor: 'start' | 'end' | 'middle' }> = {
  batam: { dx: -20, dy: -26, anchor: 'end' },
  surabaya: { dx: 0, dy: 44, anchor: 'middle' },
  balikpapan: { dx: 20, dy: 2, anchor: 'start' },
  sorong: { dx: 0, dy: -44, anchor: 'middle' },
}

export function IndonesiaMap({
  regions,
  summaries,
  selected,
  onSelect,
}: {
  regions: Region[]
  summaries: RegionSummary[]
  selected: RegionId | null
  onSelect: (id: RegionId | null) => void
}) {
  const reduce = useReducedMotion()
  const [hover, setHover] = useState<RegionId | null>(null)
  const hovered = hover ? regions.find((r) => r.id === hover)! : null
  const hoveredSummary = hover ? summaries.find((s) => s.regionId === hover)! : null

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full [transform:translateZ(0)]" role="img" aria-label="Map of Indonesia with four candidate coordination nodes">
        <defs>
          <pattern id="land-dots" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="3.5" cy="3.5" r="1" fill="#8EA4B5" fillOpacity=".34" />
          </pattern>
          <linearGradient id="land-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a3a58" />
            <stop offset="1" stopColor="#12293f" />
          </linearGradient>
          <filter id="coast-glow" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* chart graticule */}
        <path d={GRATICULE_PATH} fill="none" stroke="#8EA4B5" strokeOpacity=".07" strokeWidth="1" />
        {LON_TICKS.map((t) => (
          <text key={t.label} x={t.x + 4} y={H - 6} className="fill-text-3 font-mono" fontSize="11" opacity=".7">
            {t.label}
          </text>
        ))}
        {LAT_TICKS.map((t) => (
          <text key={t.label} x={6} y={t.y - 4} className="fill-text-3 font-mono" fontSize="9.5" opacity=".7">
            {t.label}
          </text>
        ))}

        {/* context: neighbouring countries */}
        <path d={NEIGHBOURS_PATH} fill="#0e2134" stroke="#8EA4B5" strokeOpacity=".14" strokeWidth=".6" />

        {/* Indonesia */}
        <motion.g initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }}>
          <path d={INDONESIA_PATH} fill="none" stroke="#127C91" strokeOpacity=".55" strokeWidth="5" filter="url(#coast-glow)" />
          <path d={INDONESIA_PATH} fill="url(#land-fill)" />
          <path d={INDONESIA_PATH} fill="url(#land-dots)" />
          <path d={INDONESIA_PATH} fill="none" stroke="#76CFDA" strokeOpacity=".42" strokeWidth=".7" strokeLinejoin="round" />
        </motion.g>

      </svg>

      {/* Animated layer is a separate SVG so the heavy static geography above is never repainted. */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="node-glow">
            <stop offset="0" stopColor="#76CFDA" stopOpacity=".55" />
            <stop offset="1" stopColor="#76CFDA" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* proposed coordination links */}
        {LINKS.map(([a, b], i) => {
          const d = arc(pos(a), pos(b))
          const active = selected === a || selected === b || hover === a || hover === b
          return (
            <g key={`${a}-${b}`}>
              <motion.path
                d={d}
                fill="none"
                stroke="#76CFDA"
                strokeOpacity={active ? 0.55 : 0.22}
                strokeWidth="1"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.9 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              />
              <path
                d={d}
                fill="none"
                stroke="#76CFDA"
                strokeOpacity={active ? 0.9 : 0.45}
                strokeWidth="1.4"
                strokeDasharray="2 14"
                strokeLinecap="round"
                className={reduce ? '' : '[animation:link-flow_3.2s_linear_infinite]'}
                style={{ animationDelay: `${i * -0.7}s` }}
              />
            </g>
          )
        })}

        {/* candidate nodes */}
        {NODE_POSITIONS.map((n, i) => {
          const s = summaries.find((x) => x.regionId === n.id)!
          const isSel = selected === n.id
          const isHover = hover === n.id
          const l = LABEL[n.id]
          return (
            <motion.g
              key={n.id}
              initial={reduce ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 + i * 0.16, type: 'spring', stiffness: 260, damping: 18 }}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}
            >
              <circle cx={n.x} cy={n.y} r={isSel ? 34 : 26} fill="url(#node-glow)" opacity={isSel || isHover ? 1 : 0.7} style={{ transition: 'r .35s, opacity .35s' }} />
              {!reduce && (
                <circle cx={n.x} cy={n.y} r="7" fill="none" stroke="#76CFDA" strokeWidth="1" style={{ transformOrigin: `${n.x}px ${n.y}px`, animation: `node-pulse 2.8s ${i * 0.5}s ease-out infinite` }} />
              )}
              <circle cx={n.x} cy={n.y} r={isSel ? 11 : 9} fill="#081522" stroke="#76CFDA" strokeOpacity={isSel ? 1 : 0.65} strokeWidth={isSel ? 1.6 : 1.2} style={{ transition: 'r .3s' }} />
              <circle cx={n.x} cy={n.y} r={isSel ? 5 : 4} fill="#76CFDA" style={{ transition: 'r .3s' }} />
              <text x={n.x + l.dx} y={n.y + l.dy} textAnchor={l.anchor} className={cx('font-sans', isSel || isHover ? 'fill-text-1' : 'fill-text-1/85')} fontSize="23" fontWeight="600">
                {n.name}
              </text>
              <text x={n.x + l.dx} y={n.y + l.dy + 21} textAnchor={l.anchor} className="fill-text-2 font-sans" fontSize="16.5">
                {s.active} active
              </text>
            </motion.g>
          )
        })}
      </svg>

      {/* Hit targets as real buttons for keyboard and screen readers */}
      {NODE_POSITIONS.map((n) => {
        const region = regions.find((r) => r.id === n.id)!
        return (
          <button
            key={n.id}
            data-tour={`map.node.${n.id}`}
            className="absolute size-12 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-offset-0"
            style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%` }}
            aria-label={`${region.name} candidate coordination node${selected === n.id ? ', selected' : ''}`}
            aria-pressed={selected === n.id}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(n.id)}
            onBlur={() => setHover(null)}
            onClick={() => onSelect(selected === n.id ? null : n.id)}
          />
        )
      })}

      <AnimatePresence>
        {hovered && hoveredSummary && (
          <motion.div
            key={hovered.id}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={cx(
              'pointer-events-none absolute z-10 w-[232px] rounded-[10px] border border-line-strong bg-[rgb(22_48_73/.96)] p-3 shadow-[var(--shadow-raised)]',
              pos(hovered.id).x > W * 0.7 ? '-translate-x-[calc(100%+22px)]' : 'translate-x-[22px]',
            )}
            style={{ left: `${(pos(hovered.id).x / W) * 100}%`, top: `${(pos(hovered.id).y / H) * 100}%`, translate: '0 -50%' }}
            role="tooltip"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-[13.5px] font-semibold text-text-1">{hovered.name}</span>
              <span className="font-mono text-[10.5px] text-text-2">{hovered.timezone}</span>
            </div>
            <div className="text-[11.5px] text-text-2">{hovered.area}</div>
            <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-line pt-2.5">
              <Stat label="Active" value={String(hoveredSummary.active)} />
              <Stat label="On time" value={fmtPct(hoveredSummary.otd.pct, 0)} />
              <Stat label="Exceptions" value={String(hoveredSummary.openExceptions)} warn={hoveredSummary.openExceptions > 0} />
            </div>
            <div className="mt-2.5 text-[10.5px] leading-snug text-amber/90">Candidate node — proposed, not an existing PT Energy facility.</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div className={cx('text-[15px] font-semibold tabular', warn ? 'text-amber' : 'text-text-1')}>{value}</div>
      <div className="text-[10.5px] text-text-2">{label}</div>
    </div>
  )
}
