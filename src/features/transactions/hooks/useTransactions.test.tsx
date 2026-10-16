import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../mocks/server.ts'
import { ERROR_MESSAGES } from '../../../shared/errors.ts'
import type { TransactionListResponseDto } from '../../../types/api.ts'
import type { Period } from '../../../types/domain.ts'
import { TransactionsProvider } from '../context/TransactionsContext.tsx'
import { useTransactions } from './useTransactions.ts'

const LIST_URL = '/api/v1/dashboard/transaction/list'

const listFor = (id: string): TransactionListResponseDto => ({
  previousBalance: 1_000_000,
  items: [
    {
      id,
      dateTime: '2026-07-23T13:12:00-05:00',
      type: 'DEPOSIT',
      description: 'Cobro factura',
      amount: 130_000,
      currency: 'COP',
      status: 'COMPLETED',
    },
  ],
})

const renderUseTransactions = (initialPeriod: Period) =>
  renderHook(({ period }) => useTransactions(period), {
    wrapper: TransactionsProvider,
    initialProps: { period: initialPeriod },
  })

describe('useTransactions', () => {
  it('carga el listado del período en el estado global', async () => {
    // Arrange
    server.use(http.get(LIST_URL, () => HttpResponse.json(listFor('TXN-006'))))

    // Act
    const { result } = renderUseTransactions('daily')

    // Assert
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('succeeded'))
    expect(result.current.period).toBe('daily')
    expect(result.current.data?.items.map(({ id }) => id)).toEqual(['TXN-006'])
    expect(result.current.error).toBeNull()
  })

  it('deja el estado en failed con el mensaje del error cuando el servicio responde 500', async () => {
    // Arrange
    server.use(http.get(LIST_URL, () => new HttpResponse(null, { status: 500 })))

    // Act
    const { result } = renderUseTransactions('daily')

    // Assert
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(result.current.error).toEqual({ kind: 'server', status: 500, message: ERROR_MESSAGES.server })
  })

  it('al cambiar de período rápido, la respuesta antigua no reemplaza a la nueva', async () => {
    // Arrange: la respuesta de daily tarda más que la de weekly
    server.use(
      http.get(LIST_URL, async ({ request }) => {
        const period = new URL(request.url).searchParams.get('period')
        if (period === 'daily') {
          await delay(150)
          return HttpResponse.json(listFor('DAILY'))
        }
        return HttpResponse.json(listFor('WEEKLY'))
      }),
    )
    const { result, rerender } = renderUseTransactions('daily')

    // Act
    rerender({ period: 'weekly' })
    await waitFor(() => expect(result.current.status).toBe('succeeded'))
    await act(() => delay(250)) // deja pasar el tiempo de la respuesta de daily

    // Assert
    expect(result.current.period).toBe('weekly')
    expect(result.current.data?.items[0].id).toBe('WEEKLY')
  })

  it('no registra como error la cancelación de la petición anterior', async () => {
    // Arrange
    server.use(
      http.get(LIST_URL, async () => {
        await delay(50)
        return HttpResponse.json(listFor('TXN-006'))
      }),
    )
    const { result, rerender } = renderUseTransactions('daily')

    // Act
    rerender({ period: 'monthly' })
    await waitFor(() => expect(result.current.status).toBe('succeeded'))

    // Assert
    expect(result.current.error).toBeNull()
    expect(result.current.period).toBe('monthly')
  })

  it('retry vuelve a pedir el listado y recupera los datos', async () => {
    // Arrange: la primera petición falla y la segunda responde bien
    let calls = 0
    server.use(
      http.get(LIST_URL, () => {
        calls += 1
        return calls === 1 ? new HttpResponse(null, { status: 503 }) : HttpResponse.json(listFor('TXN-006'))
      }),
    )
    const { result } = renderUseTransactions('daily')
    await waitFor(() => expect(result.current.status).toBe('failed'))

    // Act
    act(() => result.current.retry())

    // Assert
    await waitFor(() => expect(result.current.status).toBe('succeeded'))
    expect(calls).toBe(2)
    expect(result.current.error).toBeNull()
  })
})
