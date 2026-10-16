import { beforeEach, describe, expect, it } from 'vitest'
import type {
  SummaryResponseDto,
  TransactionDetailResponseDto,
  TransactionListResponseDto,
} from '../types/api.ts'
import { PERIODS } from '../types/domain.ts'
import type { Period } from '../types/domain.ts'
import { calculateBalance, summarizeCashFlow } from './cashFlow.ts'
import { createFixtures } from './fixtures.ts'
import { createHandlers } from './handlers.ts'
import { server } from './server.ts'

const NOW = new Date('2026-07-23T14:00:00-05:00')
const API = `${window.location.origin}/api/v1/dashboard`

const get = async <T>(path: string): Promise<{ status: number; body: T }> => {
  const response = await fetch(`${API}${path}`)
  return { status: response.status, body: (await response.json()) as T }
}

const getSummary = (period: Period) => get<SummaryResponseDto>(`/summary?period=${period}`)
const getList = (period: Period) => get<TransactionListResponseDto>(`/transaction/list?period=${period}`)

describe('handlers del backend simulado', () => {
  beforeEach(() => {
    // Arrange común: datos y reloj fijos para que las respuestas sean deterministas
    server.use(...createHandlers({ fixtures: createFixtures(NOW), now: () => NOW }))
  })

  describe('GET /dashboard/summary', () => {
    it.each(PERIODS)('responde 200 con todos los campos del resumen para %s', async (period) => {
      // Act
      const { status, body } = await getSummary(period)

      // Assert
      expect(status).toBe(200)
      expect(body).toEqual({
        period,
        previousBalance: expect.any(Number),
        currentBalance: expect.any(Number),
        transactionCount: expect.any(Number),
        pendingCount: expect.any(Number),
        totalIncome: expect.any(Number),
        totalExpense: expect.any(Number),
      })
    })

    it.each(PERIODS)('calcula el resumen de %s con RN-02 sobre las transacciones del período', async (period) => {
      // Arrange
      const { body: list } = await getList(period)
      const { totalIncome, totalExpense } = summarizeCashFlow(list.items)

      // Act
      const { body: summary } = await getSummary(period)

      // Assert
      expect(summary.previousBalance).toBe(list.previousBalance)
      expect(summary.totalIncome).toBe(totalIncome)
      expect(summary.totalExpense).toBe(totalExpense)
      expect(summary.currentBalance).toBe(calculateBalance(summary.previousBalance, totalIncome, totalExpense))
      expect(summary.transactionCount).toBe(list.items.length)
      expect(summary.pendingCount).toBe(list.items.filter(({ status }) => status === 'PENDING').length)
    })

    it('arrastra el saldo: el saldo actual coincide en todos los períodos', async () => {
      // Act
      const balances = await Promise.all(PERIODS.map(async (period) => (await getSummary(period)).body.currentBalance))

      // Assert
      expect(new Set(balances).size).toBe(1)
    })

    it.each(['', '?period=yearly'])('responde 400 con un período ausente o inválido (%s)', async (query) => {
      // Act
      const { status } = await get(`/summary${query}`)

      // Assert
      expect(status).toBe(400)
    })
  })

  describe('GET /dashboard/transaction/list', () => {
    it('devuelve las transacciones de hoy, incluidas las más recientes del SPEC', async () => {
      // Act
      const { status, body } = await getList('daily')

      // Assert
      expect(status).toBe(200)
      expect(body.items.map(({ id }) => id)).toEqual(expect.arrayContaining(['TXN-005', 'TXN-006']))
    })

    it('devuelve el listado ordenado por fecha descendente (A3)', async () => {
      // Act
      const { body } = await getList('monthly')
      const dates = body.items.map(({ dateTime }) => Date.parse(dateTime))

      // Assert
      expect(dates).toEqual([...dates].sort((a, b) => b - a))
    })

    it('no incluye los campos exclusivos del detalle', async () => {
      // Act
      const { body } = await getList('weekly')

      // Assert
      expect(body.items[0]).not.toHaveProperty('channel')
      expect(body.items[0]).not.toHaveProperty('statusHistory')
    })

    it('responde 400 con un período inválido', async () => {
      // Act
      const { status } = await get('/transaction/list?period=hoy')

      // Assert
      expect(status).toBe(400)
    })
  })

  describe('GET /dashboard/transaction/:id', () => {
    it('devuelve el detalle con canal, referencias, historial y saldo anterior', async () => {
      // Act
      const { status, body } = await get<TransactionDetailResponseDto>('/transaction/TXN-005')

      // Assert
      expect(status).toBe(200)
      expect(body.previousBalance).toEqual(expect.any(Number))
      expect(body.transaction).toMatchObject({
        id: 'TXN-005',
        status: 'PENDING',
        channel: 'WEB',
        authorizationNumber: expect.stringMatching(/^AUT-\d{6}$/),
        receiptNumber: expect.stringMatching(/^CMP-\d{6}$/),
        statusHistory: [{ status: 'PENDING', changedAt: expect.any(String) }],
      })
    })

    it('responde 404 con un id inexistente', async () => {
      // Act
      const { status } = await get('/transaction/TXN-999')

      // Assert
      expect(status).toBe(404)
    })
  })
})
