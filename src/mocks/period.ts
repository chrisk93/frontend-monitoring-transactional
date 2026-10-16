import type { Period } from '../types/domain.ts'

// Los períodos se calculan en la zona horaria local (A7): hoy, esta semana y este mes.

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

/** DP-11: la semana inicia el lunes. `getDay()` devuelve 0 para el domingo. */
const startOfWeek = (date: Date): Date => {
  const daysSinceMonday = (date.getDay() + 6) % 7
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday)
}

const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1)

const PERIOD_START: Record<Period, (now: Date) => Date> = {
  daily: startOfDay,
  weekly: startOfWeek,
  monthly: startOfMonth,
}

export const getPeriodStart = (period: Period, now: Date): Date => PERIOD_START[period](now)

/** Indica si una fecha pertenece al período en curso: desde su inicio hasta `now`, inclusive. */
export const isWithinPeriod = (date: Date, period: Period, now: Date): boolean =>
  date >= getPeriodStart(period, now) && date <= now
