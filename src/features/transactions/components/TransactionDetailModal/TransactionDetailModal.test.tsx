import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '../../../../mocks/server.ts'
import { ERROR_MESSAGES } from '../../../../shared/errors.ts'
import type { TransactionDetailResponseDto } from '../../../../types/api.ts'
import { TransactionDetailModal } from './TransactionDetailModal.tsx'

const DETAIL_URL = '/api/v1/dashboard/transaction/:id'

const detail: TransactionDetailResponseDto = {
  previousBalance: 1_000_000,
  transaction: {
    id: 'TXN-005',
    dateTime: '2026-07-23T12:11:00-05:00',
    type: 'TRANSFER',
    description: 'Transferencia pago',
    amount: 120_000,
    currency: 'COP',
    status: 'COMPLETED',
    channel: 'BANK_TRANSFER',
    authorizationNumber: 'AUT-000005',
    receiptNumber: 'CMP-000005',
    statusHistory: [
      { status: 'COMPLETED', changedAt: '2026-07-23T12:12:00-05:00' },
      { status: 'PENDING', changedAt: '2026-07-23T12:11:00-05:00' },
    ],
  },
}

const renderModal = (body: TransactionDetailResponseDto | null = detail, status = 200) => {
  server.use(
    http.get(DETAIL_URL, () => (body ? HttpResponse.json(body, { status }) : new HttpResponse(null, { status }))),
  )
  const onClose = vi.fn()
  render(<TransactionDetailModal transactionId="TXN-005" onClose={onClose} />)
  return { onClose, user: userEvent.setup() }
}

/** Devuelve el valor (`<dd>`) asociado a la etiqueta (`<dt>`) de un campo. */
const fieldValue = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent

describe('TransactionDetailModal (RF-03)', () => {
  it('muestra un indicador de carga dentro del modal mientras llega el detalle', () => {
    // Arrange / Act
    renderModal()

    // Assert
    const dialog = screen.getByRole('dialog', { name: 'Detalle de la transacción' })
    expect(within(dialog).getByRole('status')).toHaveTextContent('Cargando detalle…')
  })

  it('muestra todos los campos del listado, el canal y las referencias', async () => {
    // Arrange / Act
    renderModal()

    // Assert
    expect(await screen.findByText('Canal')).toBeInTheDocument()
    expect(fieldValue('ID')).toBe('TXN-005')
    expect(fieldValue('Fecha y hora')).toBe('23/07/2026, 12:11')
    expect(fieldValue('Tipo')).toBe('Transferencia')
    expect(fieldValue('Descripción')).toBe('Transferencia pago')
    expect(fieldValue('Monto')).toBe('$120.000 COP')
    expect(fieldValue('Moneda')).toBe('COP')
    expect(fieldValue('Estado')).toBe('Completada')
    expect(fieldValue('Canal')).toBe('Transferencia bancaria')
    expect(fieldValue('Número de autorización')).toBe('AUT-000005')
    expect(fieldValue('Comprobante')).toBe('CMP-000005')
  })

  it('muestra el historial de estados en orden cronológico', async () => {
    // Arrange / Act
    renderModal()

    // Assert
    const history = await screen.findByRole('list', { name: 'Historial de cambios de estado' })
    expect(within(history).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Pendiente23/07/2026, 12:11',
      'Completada23/07/2026, 12:12',
    ])
    expect(screen.getByRole('heading', { name: 'Historial de estados' })).toBeInTheDocument()
  })

  it('marca el monto inválido (DP-6)', async () => {
    // Arrange / Act
    renderModal({ ...detail, transaction: { ...detail.transaction, amount: 12_000_000 } })

    // Assert
    expect(await screen.findByText('Monto inválido')).toBeInTheDocument()
  })

  it.each(['PENDING', 'COMPLETED', 'REJECTED'] as const)(
    'no ofrece acciones de aprobar ni rechazar para una transacción %s (RN-06)',
    async (status) => {
      // Arrange / Act
      renderModal({ ...detail, transaction: { ...detail.transaction, status } })

      // Assert
      const dialog = await screen.findByRole('dialog')
      await within(dialog).findByText('Canal')
      expect(within(dialog).queryByRole('button', { name: /aprobar/i })).not.toBeInTheDocument()
      expect(within(dialog).queryByRole('button', { name: /rechazar/i })).not.toBeInTheDocument()
      expect(within(dialog).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
        'Cerrar',
      ])
    },
  )

  it('muestra el mensaje de transacción inexistente sin opción de reintentar (404)', async () => {
    // Arrange / Act
    renderModal({ ...detail }, 404)

    // Assert
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(ERROR_MESSAGES.not_found)
    expect(within(alert).queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })

  it('ante un error del servicio permite reintentar hasta mostrar el detalle', async () => {
    // Arrange: la primera petición falla y la segunda responde bien
    let calls = 0
    server.use(
      http.get(DETAIL_URL, () => {
        calls += 1
        return calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(detail)
      }),
    )
    const user = userEvent.setup()
    render(<TransactionDetailModal transactionId="TXN-005" onClose={vi.fn()} />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(ERROR_MESSAGES.server)

    // Act
    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    // Assert
    expect(await screen.findByText('Canal')).toBeInTheDocument()
    expect(calls).toBe(2)
  })

  it('se puede cerrar', async () => {
    // Arrange
    const { onClose, user } = renderModal()
    await screen.findByText('Canal')

    // Act
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    // Assert
    expect(onClose).toHaveBeenCalledOnce()
  })
})
