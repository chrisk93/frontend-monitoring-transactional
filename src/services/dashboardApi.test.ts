import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { createFixtures } from '../mocks/fixtures.ts'
import { createHandlers } from '../mocks/handlers.ts'
import { server } from '../mocks/server.ts'
import { ERROR_MESSAGES, INVALID_RESPONSE_MESSAGE } from '../shared/errors.ts'
import { getSummary, getTransactionById, getTransactions } from './dashboardApi.ts'

const NOW = new Date('2026-07-23T14:00:00-05:00')
const API = '/api/v1/dashboard'

describe('dashboardApi', () => {
  beforeEach(() => {
    // Arrange común: backend simulado con datos y reloj fijos
    server.use(...createHandlers({ fixtures: createFixtures(NOW), now: () => NOW }))
  })

  describe('getSummary', () => {
    it('devuelve el resumen del período como modelo de dominio', async () => {
      // Act
      const summary = await getSummary('weekly')

      // Assert
      expect(summary).toEqual({
        period: 'weekly',
        previousBalance: expect.any(Number),
        currentBalance: expect.any(Number),
        transactionCount: expect.any(Number),
        pendingCount: expect.any(Number),
        totalIncome: expect.any(Number),
        totalExpense: expect.any(Number),
      })
    })

    it('envía el período como query param', async () => {
      // Arrange
      let requestedPeriod: string | null = null
      server.use(
        http.get(`${API}/summary`, ({ request }) => {
          requestedPeriod = new URL(request.url).searchParams.get('period')
          return HttpResponse.json({ message: 'capturado' }, { status: 500 })
        }),
      )

      // Act
      await getSummary('daily').catch(() => undefined)

      // Assert
      expect(requestedPeriod).toBe('daily')
    })
  })

  describe('getTransactions', () => {
    it('devuelve el listado del período con isAmountValid calculado', async () => {
      // Act
      const list = await getTransactions('monthly')

      // Assert
      expect(list.previousBalance).toEqual(expect.any(Number))
      expect(list.items.length).toBeGreaterThan(20)
      expect(list.items[0]).toEqual(expect.objectContaining({ isAmountValid: true }))
    })
  })

  describe('getTransactionById', () => {
    it('devuelve el detalle de una transacción', async () => {
      // Act
      const detail = await getTransactionById('TXN-005')

      // Assert
      expect(detail).toMatchObject({ id: 'TXN-005', status: 'PENDING', channel: 'WEB', isAmountValid: true })
      expect(detail.statusHistory).toEqual([{ status: 'PENDING', changedAt: expect.any(String) }])
    })

    it('codifica el id en la URL', async () => {
      // Arrange
      let requestedPath = ''
      server.use(
        http.get(`${API}/transaction/:id`, ({ request }) => {
          requestedPath = new URL(request.url).pathname
          return HttpResponse.json({ message: 'capturado' }, { status: 404 })
        }),
      )

      // Act
      await getTransactionById('TXN 1/../list').catch(() => undefined)

      // Assert
      expect(requestedPath).toBe('/api/v1/dashboard/transaction/TXN%201%2F..%2Flist')
    })

    it('rechaza con not_found cuando la transacción no existe', async () => {
      // Act
      const request = getTransactionById('TXN-999')

      // Assert
      await expect(request).rejects.toEqual({ kind: 'not_found', status: 404, message: ERROR_MESSAGES.not_found })
    })
  })

  describe('manejo de errores', () => {
    it('convierte un error 500 en AppError de tipo server', async () => {
      // Arrange
      server.use(http.get(`${API}/transaction/list`, () => new HttpResponse(null, { status: 500 })))

      // Act
      const request = getTransactions('daily')

      // Assert
      await expect(request).rejects.toEqual({ kind: 'server', status: 500, message: ERROR_MESSAGES.server })
    })

    it('convierte un fallo de red en AppError de tipo network', async () => {
      // Arrange
      server.use(http.get(`${API}/summary`, () => HttpResponse.error()))

      // Act
      const request = getSummary('daily')

      // Assert
      await expect(request).rejects.toEqual({ kind: 'network', message: ERROR_MESSAGES.network })
    })

    it('rechaza con el error de A6 cuando la respuesta tiene forma inválida', async () => {
      // Arrange
      server.use(http.get(`${API}/summary`, () => HttpResponse.json({ period: 'daily' })))

      // Act
      const request = getSummary('daily')

      // Assert
      await expect(request).rejects.toEqual({ kind: 'unknown', message: INVALID_RESPONSE_MESSAGE })
    })

    it('rechaza con cancelled cuando se aborta la señal', async () => {
      // Arrange
      const controller = new AbortController()
      controller.abort()

      // Act
      const request = getTransactions('daily', controller.signal)

      // Assert
      await expect(request).rejects.toEqual({ kind: 'cancelled', message: ERROR_MESSAGES.cancelled })
    })
  })
})
