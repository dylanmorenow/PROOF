import { DEMO_NOW } from '@/data/dates'
import type { ISODate, ISODateTime } from '@/data/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ZONES: Record<string, string> = { '+07:00': 'WIB', '+08:00': 'WITA', '+09:00': 'WIT' }

export const fmtInt = (n: number) => n.toLocaleString('en-US')

export const fmtPct = (n: number | null | undefined, digits = 1) => (n == null ? '—' : `${n.toFixed(digits)}%`)

export const fmtUsd = (n: number) => `US$${Math.round(n).toLocaleString('en-US')}`

export const fmtPts = (n: number, digits = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)} pp`

export function fmtDate(d: ISODate | ISODateTime, withYear = true): string {
  const [y, m, dd] = d.slice(0, 10).split('-').map(Number)
  return `${dd} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`
}

export function fmtMonth(month: string, withYear = false): string {
  const [y, m] = month.split('-').map(Number)
  return withYear ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1]
}

/** Local wall-clock time with the Indonesian zone label, e.g. "14:32 WITA". */
export function fmtTime(s: ISODateTime): string {
  return `${s.slice(11, 16)} ${ZONES[s.slice(19)] ?? ''}`.trim()
}

export const fmtStamp = (s: ISODateTime) => `${fmtDate(s)} · ${fmtTime(s)}`

export function fmtRelative(s: ISODateTime | ISODate): string {
  const t = s.length > 10 ? Date.parse(s) : Date.parse(`${s}T12:00:00+07:00`)
  const mins = Math.round((Date.parse(DEMO_NOW) - t) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  if (d === 1) return 'yesterday'
  if (d < 14) return `${d} days ago`
  return fmtDate(s, false)
}

export function fmtSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(kb >= 10_240 ? 0 : 1)} MB` : `${kb} KB`
}
