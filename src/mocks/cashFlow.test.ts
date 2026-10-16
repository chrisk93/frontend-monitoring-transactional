import { describe, expect, it } from 'vitest'
import type { TransactionStatus, TransactionType } from '../types/domain.ts'
import { calculateBalance, classifyCashFlow, summarizeCashFlow } from './cashFlow.ts'

const entry = (type: TransactionType, amount: number, status: TransactionStatus = 'COMPLETED') => ({
  type,
  amount,
  status,
})

describe('classifyCashFlow (RN-02)', () => {
  it.each([
    ['DEPOSIT', 'income'],
    ['WITHDRAWAL', 'expense'],
    ['TRANSFER', 'expense'],
    ['SERVICE_PAYMENT', 'expense'],
  ] as const)('clasifica %s como %s', (type, expected) => {
    // Arrange: tipo definido en la tabla

    // Act
    const result = classifyCashFlow(type)

    // Assert
    expect(result).toBe(expected)
  })
})

describe('summarizeCashFlow (RN-02)', () => {
  it('suma ingresos y egresos de transacciones completadas', () => {
    // Arrange
    const transactions = [
      entry('DEPOSIT', 1000),
      entry('WITHDRAWAL', 200),
      entry('TRANSFER', 300),
      entry('SERVICE_PAYMENT', 50),
    ]

    // Act
    const result = summarizeCashFlow(transactions)

    // Assert
    expect(result).toEqual({ totalIncome: 1000, totalExpense: 550 })
  })

  it.each(['PENDING', 'REJECTED', 'RETURNED'] as const)(
    'excluye transacciones en estado %s',
    (status) => {
      // Arrange
      const transactions = [entry('DEPOSIT', 1000, status), entry('TRANSFER', 500, status)]

      // Act
      const result = summarizeCashFlow(transactions)

      // Assert
      expect(result).toEqual({ totalIncome: 0, totalExpense: 0 })
    },
  )

  it('excluye transacciones completadas con monto inválido (DP-6)', () => {
    // Arrange
    const transactions = [
      entry('DEPOSIT', 1000),
      entry('DEPOSIT', -500),
      entry('WITHDRAWAL', 10_000_000.01),
    ]

    // Act
    const result = summarizeCashFlow(transactions)

    // Assert
    expect(result).toEqual({ totalIncome: 1000, totalExpense: 0 })
  })

  it('devuelve totales en 0 para una lista vacía', () => {
    // Arrange
    const transactions: never[] = []

    // Act
    const result = summarizeCashFlow(transactions)

    // Assert
    expect(result).toEqual({ totalIncome: 0, totalExpense: 0 })
  })

  it('redondea a 2 decimales las sumas con decimales (DP-10)', () => {
    // Arrange
    const transactions = [
      entry('DEPOSIT', 0.1),
      entry('DEPOSIT', 0.2),
      entry('TRANSFER', 1.234),
      entry('TRANSFER', 0.002),
    ]

    // Act
    const result = summarizeCashFlow(transactions)

    // Assert
    expect(result.totalIncome).toBe(0.3)
    expect(result.totalExpense).toBe(1.24)
  })

  it('no modifica la lista recibida', () => {
    // Arrange
    const transactions = [entry('DEPOSIT', 1000), entry('TRANSFER', 200, 'PENDING')]
    const snapshot = structuredClone(transactions)

    // Act
    summarizeCashFlow(transactions)

    // Assert
    expect(transactions).toEqual(snapshot)
  })
})

describe('calculateBalance (RN-02)', () => {
  it('suma ingresos y resta egresos al saldo anterior', () => {
    // Arrange
    const previousBalance = 1_000_000

    // Act
    const result = calculateBalance(previousBalance, 500_000, 200_000)

    // Assert
    expect(result).toBe(1_300_000)
  })

  it('redondea el saldo a 2 decimales', () => {
    // Arrange
    const previousBalance = 0.1

    // Act
    const result = calculateBalance(previousBalance, 0.2, 0)

    // Assert
    expect(result).toBe(0.3)
  })

  it('calcula el saldo esperado con las transacciones de ejemplo del SPEC', () => {
    // Arrange: TXN-001 a TXN-006; TXN-005 está pendiente y no afecta el saldo
    const previousBalance = 1_000_000
    const specTransactions = [
      entry('DEPOSIT', 10_000_000),
      entry('TRANSFER', 3_500_000),
      entry('WITHDRAWAL', 2_000_000),
      entry('SERVICE_PAYMENT', 100_000),
      entry('TRANSFER', 120_000, 'PENDING'),
      entry('DEPOSIT', 130_000),
    ]

    // Act
    const { totalIncome, totalExpense } = summarizeCashFlow(specTransactions)
    const result = calculateBalance(previousBalance, totalIncome, totalExpense)

    // Assert
    expect(totalIncome).toBe(10_130_000)
    expect(totalExpense).toBe(5_600_000)
    expect(result).toBe(5_530_000)
  })
})
