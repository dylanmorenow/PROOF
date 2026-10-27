import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import type { RegionSummary } from '@/data/selectors'
import type { Region, RegionId } from '@/data/types'
import { cx } from '@/lib/cx'
import { fmtPct } from '@/lib/format'
import { INDONESIA_PATH, MAP_HEIGHT, MAP_WIDTH, NEIGHBOURS_PATH, NODE_POSITIONS } from './geo.generated'

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
        <path d={NEIGHBOURS_PATH} fill="#EBEEF2" stroke="#D5DCE3" strokeWidth=".6" />
        <motion.path d={INDONESIA_PATH} fill="#DCE8EE" stroke="#127C91" strokeOpacity=".35" strokeWidth=".7" strokeLinejoin="round" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      </svg>

      {/* Animated layer is a separate SVG so the heavy static geography above is never repainted. */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {/* proposed coordination links */}
        {LINKS.map(([a, b], i) => {
          const d = arc(pos(a), pos(b))
          const active = selected === a || selected === b || hover === a || hover === b
          return (
            <motion.path
              key={`${a}-${b}`}
              d={d}
              fill="none"
              stroke="#127C91"
              strokeOpacity={active ? 0.7 : 0.3}
              strokeWidth="1.5"
              strokeDasharray="4 6"
              strokeLinecap="round"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.08 }}
            />
          )
        })}

        {/* candidate nodes */}
        {NODE_POSITIONS.map((n, i) => {
          const s = summaries.find((x) => x.regionId === n.id)!
          const isSel = selected === n.id
          const l = LABEL[n.id]
          return (
            <motion.g
              key={n.id}
              initial={reduce ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08, type: 'spring', bounce: 0, duration: 0.4 }}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}
            >
              {!reduce && (
                <circle cx={n.x} cy={n.y} r="7" fill="none" stroke="#127C91" strokeWidth="1" style={{ transformOrigin: `${n.x}px ${n.y}px`, animation: `node-pulse 2.8s ${i * 0.5}s ease-out infinite` }} />
              )}
              <circle cx={n.x} cy={n.y} r={isSel ? 12 : 10} fill="#ffffff" stroke="#127C91" strokeWidth={isSel ? 3 : 2} style={{ transition: 'r .3s' }} />
              <circle cx={n.x} cy={n.y} r={isSel ? 5 : 4} fill="#127C91" style={{ transition: 'r .3s' }} />
              <text x={n.x + l.dx} y={n.y + l.dy} textAnchor={l.anchor} className="fill-text-1 font-sans" fontSize="24" fontWeight="600">
                {n.name}
              </text>
              <text x={n.x + l.dx} y={n.y + l.dy + 21} textAnchor={l.anchor} className="fill-text-2 font-sans" fontSize="18">
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
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className={cx(
              'pointer-events-none absolute z-10 w-[232px] rounded-[14px] border border-line bg-white/90 backdrop-blur-xl p-3.5 shadow-[var(--shadow-raised)]',
              pos(hovered.id).x > W * 0.7 ? '-translate-x-[calc(100%+22px)]' : 'translate-x-[22px]',
            )}
            style={{ left: `${(pos(hovered.id).x / W) * 100}%`, top: `${(pos(hovered.id).y / H) * 100}%`, translate: '0 -50%' }}
            role="tooltip"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-[13.5px] font-semibold text-text-1">{hovered.name}</span>
              <span className="text-[12px] text-text-3">{hovered.timezone}</span>
            </div>
            <div className="text-[12.5px] text-text-2">{hovered.area}</div>
            <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-line pt-2.5">
              <Stat label="Active" value={String(hoveredSummary.active)} />
              <Stat label="On time" value={fmtPct(hoveredSummary.otd.pct, 0)} />
              <Stat label="Exceptions" value={String(hoveredSummary.openExceptions)} warn={hoveredSummary.openExceptions > 0} />
            </div>
            <div className="mt-2.5 text-[11.5px] leading-snug text-text-3">Proposed node, not an existing facility.</div>
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
      <div className="text-[11.5px] text-text-2">{label}</div>
    </div>
  )
}
