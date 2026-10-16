import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../mocks/server.ts'
import { ERROR_MESSAGES } from '../../../shared/errors.ts'
import type { SummaryResponseDto } from '../../../types/api.ts'
import type { Period } from '../../../types/domain.ts'
import { useSummary } from './useSummary.ts'

const SUMMARY_URL = '/api/v1/dashboard/summary'

const summaryFor = (period: Period, currentBalance: number): SummaryResponseDto => ({
  period,
  previousBalance: 1_000_000,
  currentBalance,
  transactionCount: 6,
  pendingCount: 1,
  totalIncome: 10_130_000,
  totalExpense: 5_600_000,
})

const renderUseSummary = (initialPeriod: Period) =>
  renderHook(({ period }) => useSummary(period), { initialProps: { period: initialPeriod } })

describe('useSummary', () => {
  it('carga el resumen del período en estado local', async () => {
    // Arrange
    server.use(http.get(SUMMARY_URL, () => HttpResponse.json(summaryFor('monthly', 5_530_000))))

    // Act
    const { result } = renderUseSummary('monthly')

    // Assert
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('succeeded'))
    expect(result.current.data).toEqual(summaryFor('monthly', 5_530_000))
    expect(result.current.error).toBeNull()
  })

  it('deja el estado en failed con el mensaje del error cuando el servicio responde 500', async () => {
    // Arrange
    server.use(http.get(SUMMARY_URL, () => new HttpResponse(null, { status: 500 })))

    // Act
    const { result } = renderUseSummary('daily')

    // Assert
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(result.current.error).toEqual({ kind: 'server', status: 500, message: ERROR_MESSAGES.server })
  })

  it('al cambiar de período rápido, la respuesta antigua no reemplaza a la nueva', async () => {
    // Arrange: la respuesta de daily tarda más que la de weekly
    server.use(
      http.get(SUMMARY_URL, async ({ request }) => {
        const period = new URL(request.url).searchParams.get('period')
        if (period === 'daily') {
          await delay(150)
          return HttpResponse.json(summaryFor('daily', 1))
        }
        return HttpResponse.json(summaryFor('weekly', 2))
      }),
    )
    const { result, rerender } = renderUseSummary('daily')

    // Act
    rerender({ period: 'weekly' })
    await waitFor(() => expect(result.current.status).toBe('succeeded'))
    await act(() => delay(250)) // deja pasar el tiempo de la respuesta de daily

    // Assert
    expect(result.current.data?.period).toBe('weekly')
    expect(result.current.data?.currentBalance).toBe(2)
    expect(result.current.error).toBeNull()
  })

  it('retry vuelve a pedir el resumen y recupera los datos', async () => {
    // Arrange: la primera petición falla y la segunda responde bien
    let calls = 0
    server.use(
      http.get(SUMMARY_URL, () => {
        calls += 1
        return calls === 1
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json(summaryFor('daily', 5_530_000))
      }),
    )
    const { result } = renderUseSummary('daily')
    await waitFor(() => expect(result.current.status).toBe('failed'))

    // Act
    act(() => result.current.retry())

    // Assert
    await waitFor(() => expect(result.current.status).toBe('succeeded'))
    expect(calls).toBe(2)
    expect(result.current.error).toBeNull()
  })
})
