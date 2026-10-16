import { describe, expect, it } from 'vitest'
import { validateAmount } from '../features/transactions/domain/validateAmount.ts'
import { mapTransactionDetail } from '../services/mappers.ts'
import { PERIODS } from '../types/domain.ts'
import { createFixtures } from './fixtures.ts'
import { isWithinPeriod } from './period.ts'

const NOW = new Date('2026-07-23T14:00:00-05:00')

describe('createFixtures', () => {
  it('es determinista: el mismo now produce las mismas fixtures (A5)', () => {
    // Arrange / Act
    const first = createFixtures(NOW)
    const second = createFixtures(NOW)

    // Assert
    expect(second).toEqual(first)
  })

  it('incluye las 6 transacciones del SPEC y ~40 generadas, con ids únicos (DP-5)', () => {
    // Arrange / Act
    const fixtures = createFixtures(NOW)
    const ids = fixtures.map(({ id }) => id)

    // Assert
    expect(fixtures).toHaveLength(46)
    expect(new Set(ids).size).toBe(46)
  })

  it('conserva tipo, descripción, monto, estado y canal de las transacciones del SPEC (DP-4)', () => {
    // Arrange
    const fixtures = createFixtures(NOW)

    // Act
    const spec = ['TXN-001', 'TXN-002', 'TXN-003', 'TXN-004', 'TXN-005', 'TXN-006'].map((id) => {
      const fixture = fixtures.find((transaction) => transaction.id === id)
      return fixture && [fixture.type, fixture.description, fixture.amount, fixture.status, fixture.channel]
    })

    // Assert
    expect(spec).toEqual([
      ['DEPOSIT', 'Pago de nómina quincenal', 10_000_000, 'COMPLETED', 'MOBILE_APP'],
      ['TRANSFER', 'Pago proveedor', 3_500_000, 'COMPLETED', 'WEB'],
      ['WITHDRAWAL', 'Retiro Caja comp.', 2_000_000, 'COMPLETED', 'POINT_OF_SALE'],
      ['SERVICE_PAYMENT', 'Pago de internet', 100_000, 'COMPLETED', 'MOBILE_APP'],
      ['TRANSFER', 'Transferencia pago', 120_000, 'PENDING', 'WEB'],
      ['DEPOSIT', 'Cobro factura', 130_000, 'COMPLETED', 'WEB'],
    ])
  })

  it('ubica las transacciones del SPEC relativas a now, conservando la distancia entre ellas', () => {
    // Arrange
    const fixtures = createFixtures(NOW)
    const dateOf = (id: string) => Date.parse(fixtures.find((fixture) => fixture.id === id)?.dateTime ?? '')

    // Act
    const latestOffsetMinutes = (NOW.getTime() - dateOf('TXN-006')) / 60_000
    const gapMinutes = (dateOf('TXN-006') - dateOf('TXN-005')) / 60_000

    // Assert
    expect(latestOffsetMinutes).toBe(5)
    expect(gapMinutes).toBe(61) // 12:11 → 13:12 en el SPEC
  })

  it('ordena las transacciones por fecha descendente (A3)', () => {
    // Arrange / Act
    const dates = createFixtures(NOW).map(({ dateTime }) => Date.parse(dateTime))

    // Assert
    expect(dates).toEqual([...dates].sort((a, b) => b - a))
  })

  it('no genera transacciones posteriores a now', () => {
    // Arrange / Act
    const fixtures = createFixtures(NOW)

    // Assert
    expect(fixtures.every(({ dateTime }) => new Date(dateTime) <= NOW)).toBe(true)
  })

  it.each(PERIODS)('tiene al menos una transacción en el período %s', (period) => {
    // Arrange
    const fixtures = createFixtures(NOW)

    // Act
    const inPeriod = fixtures.filter(({ dateTime }) => isWithinPeriod(new Date(dateTime), period, NOW))

    // Assert
    expect(inPeriod.length).toBeGreaterThan(0)
  })

  it('genera más de una página de transacciones en el mes (DP-5)', () => {
    // Arrange
    const fixtures = createFixtures(NOW)

    // Act
    const monthly = fixtures.filter(({ dateTime }) => isWithinPeriod(new Date(dateTime), 'monthly', NOW))

    // Assert
    expect(monthly.length).toBeGreaterThan(20)
  })

  it('usa montos válidos y deja pendientes las generadas mayores a $5.000.000 (RN-01)', () => {
    // Arrange
    const fixtures = createFixtures(NOW)

    // Act
    const highValueGenerated = fixtures.filter(({ id, amount }) => id > 'TXN-006' && amount > 5_000_000)

    // Assert
    expect(fixtures.every(({ amount }) => validateAmount(amount))).toBe(true)
    expect(highValueGenerated.length).toBeGreaterThan(0)
    expect(highValueGenerated.every(({ status }) => status === 'PENDING')).toBe(true)
  })

  it('incluye montos con decimales para ejercitar el formato de moneda (RN-05)', () => {
    // Arrange / Act
    const fixtures = createFixtures(NOW)

    // Assert
    expect(fixtures.some(({ amount }) => !Number.isInteger(amount))).toBe(true)
  })

  it('termina el historial de estados con el estado actual de la transacción', () => {
    // Arrange / Act
    const fixtures = createFixtures(NOW)

    // Assert
    expect(fixtures.every(({ status, statusHistory }) => statusHistory.at(-1)?.status === status)).toBe(true)
  })

  it('cumple el contrato de la API: cada fixture pasa la validación de los mappers', () => {
    // Arrange
    const fixtures = createFixtures(NOW)

    // Act
    const map = () => fixtures.map((transaction) => mapTransactionDetail({ previousBalance: 0, transaction }))

    // Assert
    expect(map).not.toThrow()
  })
})
