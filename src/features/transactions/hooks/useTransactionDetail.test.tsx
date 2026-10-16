import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../mocks/server.ts'
import { ERROR_MESSAGES } from '../../../shared/errors.ts'
import type { TransactionDetailResponseDto } from '../../../types/api.ts'
import { useTransactionDetail } from './useTransactionDetail.ts'

const DETAIL_URL = '/api/v1/dashboard/transaction/:id'

const detailFor = (id: string): TransactionDetailResponseDto => ({
  previousBalance: 1_000_000,
  transaction: {
    id,
    dateTime: '2026-07-23T12:11:00-05:00',
    type: 'TRANSFER',
    description: 'Transferencia pago',
    amount: 120_000,
    currency: 'COP',
    status: 'PENDING',
    channel: 'WEB',
    authorizationNumber: 'AUT-000005',
    receiptNumber: 'CMP-000005',
    statusHistory: [{ status: 'PENDING', changedAt: '2026-07-23T12:11:00-05:00' }],
  },
})

const renderUseTransactionDetail = (initialId: string) =>
  renderHook(({ id }) => useTransactionDetail(id), { initialProps: { id: initialId } })

describe('useTransactionDetail', () => {
  it('carga el detalle de la transacción en estado local', async () => {
    // Arrange
    server.use(http.get(DETAIL_URL, ({ params }) => HttpResponse.json(detailFor(String(params.id)))))

    // Act
    const { result } = renderUseTransactionDetail('TXN-005')

    // Assert
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('succeeded'))
    expect(result.current.data).toMatchObject({ id: 'TXN-005', channel: 'WEB', receiptNumber: 'CMP-000005' })
  })

  it('muestra el mensaje de transacción inexistente cuando el servicio responde 404', async () => {
    // Arrange
    server.use(http.get(DETAIL_URL, () => HttpResponse.json({ message: 'no existe' }, { status: 404 })))

    // Act
    const { result } = renderUseTransactionDetail('TXN-999')

    // Assert
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(result.current.error).toEqual({ kind: 'not_found', status: 404, message: ERROR_MESSAGES.not_found })
    expect(result.current.error?.message).toBe('La transacción no existe o no está disponible.')
  })

  it('al cambiar de id, la respuesta anterior no reemplaza a la nueva', async () => {
    // Arrange: la respuesta de TXN-001 tarda más que la de TXN-002
    server.use(
      http.get(DETAIL_URL, async ({ params }) => {
        if (params.id === 'TXN-001') await delay(150)
        return HttpResponse.json(detailFor(String(params.id)))
      }),
    )
    const { result, rerender } = renderUseTransactionDetail('TXN-001')

    // Act
    rerender({ id: 'TXN-002' })
    await waitFor(() => expect(result.current.status).toBe('succeeded'))
    await act(() => delay(250)) // deja pasar el tiempo de la respuesta de TXN-001

    // Assert
    expect(result.current.data?.id).toBe('TXN-002')
    expect(result.current.error).toBeNull()
  })

  it('retry vuelve a pedir el detalle y recupera los datos', async () => {
    // Arrange: la primera petición falla y la segunda responde bien
    let calls = 0
    server.use(
      http.get(DETAIL_URL, ({ params }) => {
        calls += 1
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(detailFor(String(params.id)))
      }),
    )
    const { result } = renderUseTransactionDetail('TXN-005')
    await waitFor(() => expect(result.current.status).toBe('failed'))

    // Act
    act(() => result.current.retry())

    // Assert
    await waitFor(() => expect(result.current.status).toBe('succeeded'))
    expect(calls).toBe(2)
    expect(result.current.error).toBeNull()
  })
})
