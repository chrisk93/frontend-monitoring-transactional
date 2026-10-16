import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createFixtures } from '../mocks/fixtures.ts'
import { createHandlers } from '../mocks/handlers.ts'
import { server } from '../mocks/server.ts'
import { renderWithProviders } from '../test/renderWithProviders.tsx'

const NOW = new Date('2026-07-23T14:00:00-05:00')

const findDetailDialog = async () => {
  const dialog = await screen.findByRole('dialog', { name: 'Detalle de la transacción' })
  await within(dialog).findByText('Transferencia pago')
  return dialog
}

describe('rutas de la aplicación', () => {
  beforeEach(() => {
    server.use(...createHandlers({ fixtures: createFixtures(NOW), now: () => NOW }))
  })

  it('muestra el layout con el título de la aplicación', () => {
    // Arrange / Act
    renderWithProviders('/')

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard de Monitoreo Transaccional' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('muestra NotFoundPage en una ruta desconocida', () => {
    // Arrange / Act
    renderWithProviders('/no-existe')

    // Assert
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al dashboard' })).toHaveAttribute('href', '/')
  })

  it('abre el detalle como modal al entrar directamente a /transactions/:id', async () => {
    // Arrange / Act
    renderWithProviders('/transactions/TXN-005')

    // Assert
    expect(await findDetailDialog()).toBeInTheDocument()
  })

  it('al cerrar un detalle abierto por URL vuelve al dashboard conservando la página', async () => {
    // Arrange
    const { router, user } = renderWithProviders('/transactions/TXN-005?page=2')
    const dialog = await findDetailDialog()

    // Act
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }))

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location).toMatchObject({ pathname: '/', search: '?page=2' })
  })

  it('al cerrar un detalle abierto desde el dashboard vuelve a la entrada anterior del historial', async () => {
    // Arrange
    const { router, user } = renderWithProviders('/?page=2')
    await router.navigate('/transactions/TXN-005?page=2')
    await findDetailDialog()

    // Act
    await user.keyboard('{Escape}')

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location).toMatchObject({ pathname: '/', search: '?page=2' })
    expect(router.state.historyAction).toBe('POP')
  })
})
