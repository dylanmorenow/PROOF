import type { ISODate } from './types'

/** The fixed "today" of the demo. Every relative time in the prototype derives from it. */
export const DEMO_TODAY: ISODate = '2026-10-27'
/** Demo clock: 09:00 WIB on DEMO_TODAY. */
export const DEMO_NOW = '2026-10-27T09:00:00+07:00'

const DAY = 86_400_000

export function toDay(d: ISODate): number {
  const [y, m, dd] = d.split('-').map(Number)
  return Date.UTC(y, m - 1, dd) / DAY
}

export function fromDay(n: number): ISODate {
  return new Date(n * DAY).toISOString().slice(0, 10)
}

export function addDays(d: ISODate, days: number): ISODate {
  return fromDay(toDay(d) + days)
}

export function diffDays(a: ISODate, b: ISODate): number {
  return toDay(a) - toDay(b)
}

export function monthKey(d: ISODate): string {
  return d.slice(0, 7)
}

/** Last N calendar months ending with the month of DEMO_TODAY, oldest first ('YYYY-MM'). */
export function lastMonths(n: number, end: ISODate = DEMO_TODAY): string[] {
  const [y, m] = end.split('-').map(Number)
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(y, m - 1 - i, 1))
    out.push(date.toISOString().slice(0, 7))
  }
  return out
}

export function monthEnd(month: string): ISODate {
  const [y, m] = month.split('-').map(Number)
  const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
  return end > DEMO_TODAY ? DEMO_TODAY : end
}
