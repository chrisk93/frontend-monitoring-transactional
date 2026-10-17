import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { createFixtures } from '../../mocks/fixtures.ts'
import { createHandlers } from '../../mocks/handlers.ts'
import { server } from '../../mocks/server.ts'
import { ERROR_MESSAGES } from '../../shared/errors.ts'
import { renderWithProviders } from '../../test/renderWithProviders.tsx'
import type { TransactionDto, TransactionListResponseDto } from '../../types/api.ts'

// Con NOW fijo, el mes tiene 23 transacciones (2 páginas).
const NOW = new Date('2026-07-23T14:00:00-05:00')

const transactionsRegion = () => screen.getByRole('region', { name: 'Transacciones' })

const rowIds = () =>
  within(transactionsRegion())
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent)

const rowCells = (columnIndex: number) =>
  within(transactionsRegion())
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[columnIndex].textContent)

const waitForRows = async (count: number) => {
  await waitFor(() => expect(rowIds()).toHaveLength(count))
}

describe('DashboardPage (integración)', () => {
  beforeEach(() => {
    server.use(...createHandlers({ fixtures: createFixtures(NOW), now: () => NOW }))
  })

  it('al cargar muestra el resumen y la primera página del listado mensual', async () => {
    // Arrange / Act
    renderWithProviders('/')

    // Assert
    expect(await screen.findByText('Saldo actual')).toBeInTheDocument()
    await waitForRows(20)
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('mantiene el orden descendente de la API (A3)', async () => {
    // Arrange / Act
    renderWithProviders('/')
    await waitForRows(20)

    // Assert
    expect(rowIds().slice(0, 3)).toEqual(['TXN-006', 'TXN-005', 'TXN-007'])
  })

  it('al paginar actualiza la URL y muestra la página siguiente', async () => {
    // Arrange
    const { router, user } = renderWithProviders('/')
    await waitForRows(20)

    // Act
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    // Assert
    await waitForRows(3)
    expect(router.state.location.search).toBe('?page=2')
  })

  it('pide el resumen y el listado del período mensual', async () => {
    // Arrange
    const requestedUrls: URL[] = []
    const onRequest = ({ request }: { request: Request }) => {
      requestedUrls.push(new URL(request.url))
    }
    server.events.on('request:start', onRequest)

    // Act
    renderWithProviders('/')
    await waitForRows(20)
    server.events.removeListener('request:start', onRequest)

    // Assert
    const periodsByPath = requestedUrls.map((url) => [url.pathname, url.searchParams.get('period')])
    expect(periodsByPath).toEqual(
      expect.arrayContaining([
        ['/api/v1/dashboard/summary', 'monthly'],
        ['/api/v1/dashboard/transaction/list', 'monthly'],
      ]),
    )
    expect(periodsByPath.every(([, period]) => period === 'monthly')).toBe(true)
  })

  it('no muestra un selector de período', async () => {
    // Arrange / Act
    renderWithProviders('/')
    await waitForRows(20)

    // Assert
    expect(screen.queryByRole('group', { name: 'Período' })).not.toBeInTheDocument()
    for (const name of ['Diario', 'Semanal', 'Mensual']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    }
  })

  it('combina los filtros (AND) y vuelve a la primera página', async () => {
    // Arrange
    const { router, user } = renderWithProviders('/?page=2')
    await waitForRows(3)

    // Act
    await user.selectOptions(screen.getByRole('combobox', { name: 'Tipo' }), 'Transferencia')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'Completada')

    // Assert
    await waitFor(() => expect(rowCells(2).every((type) => type === 'Transferencia')).toBe(true))
    expect(rowCells(6).every((status) => status === 'Completada')).toBe(true)
    expect(rowIds()).toContain('TXN-002')
    expect(router.state.location.search).toBe('')
  })

  it('filtra por rango de fechas inclusivo', async () => {
    // Arrange
    renderWithProviders('/')
    await waitForRows(20)

    // Act
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-07-23' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-07-23' } })

    // Assert
    await waitFor(() => expect(rowIds()).toEqual(['TXN-006', 'TXN-005', 'TXN-007']))
  })

  it('con un rango invertido avisa y filtra solo por tipo y estado (A2)', async () => {
    // Arrange
    const { user } = renderWithProviders('/')
    await waitForRows(20)

    // Act
    await user.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'Pendiente')
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-07-23' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-07-01' } })

    // Assert
    expect(within(transactionsRegion()).getByRole('alert')).toHaveTextContent(
      'La fecha inicial no puede ser mayor que la final',
    )
    await waitFor(() => expect(rowCells(6).every((status) => status === 'Pendiente')).toBe(true))
    expect(rowIds().length).toBeGreaterThan(1)
    expect(rowIds()).toContain('TXN-005')
  })

  it('muestra el mensaje de sin coincidencias cuando ningún filtro coincide', async () => {
    // Arrange
    const { user } = renderWithProviders('/')
    await waitForRows(20)

    // Act
    await user.selectOptions(screen.getByRole('combobox', { name: 'Tipo' }), 'Retiro')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'Devuelta')

    // Assert
    expect(await screen.findByText('Ninguna transacción coincide con los filtros')).toBeInTheDocument()
    expect(within(transactionsRegion()).queryByRole('table')).not.toBeInTheDocument()
  })

  it('un error 500 en el listado muestra el mensaje mientras el resumen sigue visible, y Reintentar recupera', async () => {
    // Arrange: la primera petición del listado falla
    let listCalls = 0
    server.use(
      http.get('/api/v1/dashboard/transaction/list', () => {
        listCalls += 1
        return listCalls === 1 ? new HttpResponse(null, { status: 500 }) : undefined
      }),
    )
    const { user } = renderWithProviders('/')
    const alert = await within(transactionsRegion()).findByRole('alert')
    expect(alert).toHaveTextContent(ERROR_MESSAGES.server)
    expect(await screen.findByText('Saldo actual')).toBeInTheDocument()

    // Act
    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    // Assert
    await waitForRows(20)
    expect(within(transactionsRegion()).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('un clic en una fila abre el detalle y Esc lo cierra conservando la página', async () => {
    // Arrange
    const { router, user } = renderWithProviders('/?page=2')
    await waitForRows(3)
    const [firstId] = rowIds()

    // Act
    await user.click(screen.getByRole('link', { name: firstId ?? '' }))
    const dialog = await screen.findByRole('dialog', { name: 'Detalle de la transacción' })
    expect(await within(dialog).findByText('Canal')).toBeInTheDocument()
    await user.keyboard('{Escape}')

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location).toMatchObject({ pathname: '/', search: '?page=2' })
    expect(rowIds()).toHaveLength(3)
  })

  it('al entrar directamente a /transactions/TXN-005 muestra el modal sobre el dashboard', async () => {
    // Arrange / Act
    renderWithProviders('/transactions/TXN-005')

    // Assert
    const dialog = await screen.findByRole('dialog', { name: 'Detalle de la transacción' })
    expect(await within(dialog).findByText('Transferencia pago')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Resumen ejecutivo' })).toBeInTheDocument()
  })

  describe('con resultados de varias páginas', () => {
    const manyTransactions: TransactionDto[] = Array.from({ length: 45 }, (_, index) => ({
      id: `TXN-${String(index + 100)}`,
      dateTime: new Date(NOW.getTime() - (index + 1) * 60_000).toISOString(),
      type: index % 2 === 0 ? 'DEPOSIT' : 'TRANSFER',
      description: 'Movimiento',
      amount: 1000,
      currency: 'COP',
      status: 'COMPLETED',
    }))

    beforeEach(() => {
      server.use(
        http.get('/api/v1/dashboard/transaction/list', () =>
          HttpResponse.json<TransactionListResponseDto>({ previousBalance: 0, items: manyTransactions }),
        ),
      )
    })

    it('cambiar un filtro reinicia la página aunque la página actual siga existiendo', async () => {
      // Arrange: 22 transferencias, 2 páginas
      const { router, user } = renderWithProviders('/?page=2')
      await waitFor(() => expect(rowIds()[0]).toBe('TXN-120'))

      // Act
      await user.selectOptions(screen.getByRole('combobox', { name: 'Tipo' }), 'Transferencia')

      // Assert
      await waitFor(() => expect(router.state.location.search).toBe(''))
      expect(rowIds()).toHaveLength(20)
      expect(rowIds()[0]).toBe('TXN-101')
    })
  })

  it('ajusta ?page=99 a la última página sin agregar una entrada al historial', async () => {
    // Arrange / Act
    const { router } = renderWithProviders('/?page=99')

    // Assert
    await waitFor(() => expect(router.state.location.search).toBe('?page=2'))
    expect(router.state.historyAction).toBe('REPLACE')
    await waitForRows(3)
  })
})
