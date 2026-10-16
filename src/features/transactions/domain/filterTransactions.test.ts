import { describe, expect, it } from 'vitest'
import type { Transaction } from '../../../types/domain.ts'
import { filterTransactions } from './filterTransactions.ts'

// Las pruebas se ejecutan con TZ=America/Bogota (UTC-5), definido en vitest.config.ts.

const buildTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'TXN-000',
  dateTime: '2026-07-21T09:15:00-05:00',
  type: 'DEPOSIT',
  description: 'Movimiento de prueba',
  amount: 1000,
  currency: 'COP',
  status: 'COMPLETED',
  isAmountValid: true,
  ...overrides,
})

const transactions: readonly Transaction[] = [
  buildTransaction({ id: 'TXN-001', dateTime: '2026-07-21T09:15:00-05:00', type: 'DEPOSIT', status: 'COMPLETED' }),
  buildTransaction({ id: 'TXN-002', dateTime: '2026-07-21T09:17:00-05:00', type: 'TRANSFER', status: 'COMPLETED' }),
  buildTransaction({ id: 'TXN-003', dateTime: '2026-07-22T08:10:00-05:00', type: 'WITHDRAWAL', status: 'COMPLETED' }),
  buildTransaction({ id: 'TXN-004', dateTime: '2026-07-22T08:12:00-05:00', type: 'SERVICE_PAYMENT', status: 'REJECTED' }),
  buildTransaction({ id: 'TXN-005', dateTime: '2026-07-23T12:11:00-05:00', type: 'TRANSFER', status: 'PENDING' }),
  buildTransaction({ id: 'TXN-006', dateTime: '2026-07-23T13:12:00-05:00', type: 'DEPOSIT', status: 'RETURNED' }),
]

const ids = (result: readonly Transaction[]) => result.map(({ id }) => id)

describe('filterTransactions (RN-03)', () => {
  it('devuelve todas las transacciones sin filtros', () => {
    // Arrange
    const filters = {}

    // Act
    const result = filterTransactions(transactions, filters)

    // Assert
    expect(ids(result)).toEqual(['TXN-001', 'TXN-002', 'TXN-003', 'TXN-004', 'TXN-005', 'TXN-006'])
  })

  it('filtra por tipo', () => {
    // Arrange
    const filters = { type: 'TRANSFER' } as const

    // Act
    const result = filterTransactions(transactions, filters)

    // Assert
    expect(ids(result)).toEqual(['TXN-002', 'TXN-005'])
  })

  it('filtra por estado', () => {
    // Arrange
    const filters = { status: 'COMPLETED' } as const

    // Act
    const result = filterTransactions(transactions, filters)

    // Assert
    expect(ids(result)).toEqual(['TXN-001', 'TXN-002', 'TXN-003'])
  })

  it('filtra por rango de fechas', () => {
    // Arrange
    const filters = { from: '2026-07-22', to: '2026-07-22' }

    // Act
    const result = filterTransactions(transactions, filters)

    // Assert
    expect(ids(result)).toEqual(['TXN-003', 'TXN-004'])
  })

  it('combina todos los filtros con AND', () => {
    // Arrange
    const filters = { from: '2026-07-21', to: '2026-07-22', type: 'TRANSFER', status: 'COMPLETED' } as const

    // Act
    const result = filterTransactions(transactions, filters)

    // Assert
    expect(ids(result)).toEqual(['TXN-002'])
  })

  it('aplica solo la fecha inicial cuando no hay fecha final', () => {
    // Arrange
    const filters = { from: '2026-07-23' }

    // Act
    const result = filterTransactions(transactions, filters)

    // Assert
    expect(ids(result)).toEqual(['TXN-005', 'TXN-006'])
  })

  it('aplica solo la fecha final cuando no hay fecha inicial', () => {
    // Arrange
    const filters = { to: '2026-07-21' }

    // Act
    const result = filterTransactions(transactions, filters)

    // Assert
    expect(ids(result)).toEqual(['TXN-001', 'TXN-002'])
  })

  describe('límites del rango de fechas (A2)', () => {
    const boundaryTransactions = [
      buildTransaction({ id: 'START', dateTime: '2026-07-21T00:00:00-05:00' }),
      buildTransaction({ id: 'END', dateTime: '2026-07-21T23:59:00-05:00' }),
      buildTransaction({ id: 'NEXT_DAY', dateTime: '2026-07-22T00:00:00-05:00' }),
      buildTransaction({ id: 'PREVIOUS_DAY', dateTime: '2026-07-20T23:59:59-05:00' }),
    ]

    it('incluye una transacción del día `from` a las 00:00', () => {
      // Arrange
      const filters = { from: '2026-07-21', to: '2026-07-21' }

      // Act
      const result = filterTransactions(boundaryTransactions, filters)

      // Assert
      expect(ids(result)).toContain('START')
    })

    it('incluye una transacción del día `to` a las 23:59', () => {
      // Arrange
      const filters = { from: '2026-07-21', to: '2026-07-21' }

      // Act
      const result = filterTransactions(boundaryTransactions, filters)

      // Assert
      expect(ids(result)).toContain('END')
    })

    it('excluye las transacciones fuera del rango', () => {
      // Arrange
      const filters = { from: '2026-07-21', to: '2026-07-21' }

      // Act
      const result = filterTransactions(boundaryTransactions, filters)

      // Assert
      expect(ids(result)).toEqual(['START', 'END'])
    })
  })

  it('ignora el rango cuando `from` es mayor que `to` y aplica los demás filtros (A2)', () => {
    // Arrange
    const filters = { from: '2026-07-23', to: '2026-07-21', status: 'COMPLETED' } as const

    // Act
    const result = filterTransactions(transactions, filters)

    // Assert
    expect(ids(result)).toEqual(['TXN-001', 'TXN-002', 'TXN-003'])
  })

  it('ignora una fecha con formato inválido', () => {
    // Arrange
    const filters = { from: '21/07/2026', type: 'DEPOSIT' } as const

    // Act
    const result = filterTransactions(transactions, filters)

    // Assert
    expect(ids(result)).toEqual(['TXN-001', 'TXN-006'])
  })

  it('ignora una fecha inexistente', () => {
    // Arrange
    const filters = { to: '2026-02-31' }

    // Act
    const result = filterTransactions(transactions, filters)

    // Assert
    expect(result).toHaveLength(transactions.length)
  })

  it('devuelve una lista vacía si nada coincide', () => {
    // Arrange
    const filters = { type: 'WITHDRAWAL', status: 'PENDING' } as const

    // Act
    const result = filterTransactions(transactions, filters)

    // Assert
    expect(result).toEqual([])
  })

  it('no modifica la lista recibida', () => {
    // Arrange
    const input = [...transactions]
    const snapshot = structuredClone(input)

    // Act
    filterTransactions(input, { type: 'DEPOSIT' })

    // Assert
    expect(input).toEqual(snapshot)
  })
})
