import { describe, expect, it } from 'vitest'
import { getPeriodStart, isWithinPeriod } from './period.ts'

// Las pruebas se ejecutan con TZ=America/Bogota (UTC-5), definido en vitest.config.ts.
const local = (value: string) => new Date(`${value}-05:00`)

describe('getPeriodStart', () => {
  it.each([
    ['daily', '2026-07-23T14:00:00', '2026-07-23T00:00:00'],
    ['weekly', '2026-07-23T14:00:00', '2026-07-20T00:00:00'],
    ['monthly', '2026-07-23T14:00:00', '2026-07-01T00:00:00'],
    ['weekly', '2026-07-26T23:00:00', '2026-07-20T00:00:00'],
    ['weekly', '2026-07-20T00:00:00', '2026-07-20T00:00:00'],
  ] as const)('%s con now=%s inicia en %s', (period, now, expected) => {
    // Arrange: valores definidos en la tabla

    // Act
    const result = getPeriodStart(period, local(now))

    // Assert
    expect(result).toEqual(local(expected))
  })
})

describe('isWithinPeriod', () => {
  it('daily incluye hoy a las 00:00 y excluye ayer a las 23:59', () => {
    // Arrange
    const now = local('2026-07-23T14:00:00')

    // Act
    const todayAtMidnight = isWithinPeriod(local('2026-07-23T00:00:00'), 'daily', now)
    const yesterdayAtNight = isWithinPeriod(local('2026-07-22T23:59:59'), 'daily', now)

    // Assert
    expect(todayAtMidnight).toBe(true)
    expect(yesterdayAtNight).toBe(false)
  })

  it('weekly inicia el lunes: incluye el lunes 00:00 y excluye el domingo anterior (DP-11)', () => {
    // Arrange
    const now = local('2026-07-23T14:00:00') // jueves

    // Act
    const monday = isWithinPeriod(local('2026-07-20T00:00:00'), 'weekly', now)
    const previousSunday = isWithinPeriod(local('2026-07-19T23:59:59'), 'weekly', now)

    // Assert
    expect(monday).toBe(true)
    expect(previousSunday).toBe(false)
  })

  it('weekly en domingo incluye toda la semana desde el lunes', () => {
    // Arrange
    const now = local('2026-07-26T20:00:00') // domingo

    // Act
    const result = isWithinPeriod(local('2026-07-20T08:00:00'), 'weekly', now)

    // Assert
    expect(result).toBe(true)
  })

  it('monthly excluye el último día del mes anterior', () => {
    // Arrange
    const now = local('2026-08-01T10:00:00')

    // Act
    const firstOfMonth = isWithinPeriod(local('2026-08-01T00:00:00'), 'monthly', now)
    const endOfPreviousMonth = isWithinPeriod(local('2026-07-31T23:59:59'), 'monthly', now)

    // Assert
    expect(firstOfMonth).toBe(true)
    expect(endOfPreviousMonth).toBe(false)
  })

  it('excluye fechas posteriores a now', () => {
    // Arrange
    const now = local('2026-07-23T14:00:00')

    // Act
    const result = isWithinPeriod(local('2026-07-23T14:00:01'), 'daily', now)

    // Assert
    expect(result).toBe(false)
  })
})
