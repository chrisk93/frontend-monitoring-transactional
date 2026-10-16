import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from './AppProviders.tsx'
import { routes } from './routes.tsx'

const renderAt = (url: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { router, user: userEvent.setup() }
}

describe('rutas de la aplicación', () => {
  it('muestra el layout con el título de la aplicación', () => {
    // Arrange / Act
    renderAt('/')

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard de Monitoreo Transaccional' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('muestra NotFoundPage en una ruta desconocida', () => {
    // Arrange / Act
    renderAt('/no-existe')

    // Assert
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al dashboard' })).toHaveAttribute('href', '/')
  })

  it('abre el detalle como modal al entrar directamente a /transactions/:id', async () => {
    // Arrange / Act
    renderAt('/transactions/TXN-005')

    // Assert
    expect(screen.getByRole('dialog', { name: 'Detalle de la transacción' })).toBeInTheDocument()
    expect(await screen.findByText('Transferencia pago')).toBeInTheDocument()
  })

  it('al cerrar un detalle abierto por URL vuelve al dashboard conservando la página', async () => {
    // Arrange
    const { router, user } = renderAt('/transactions/TXN-005?page=2')
    await screen.findByText('Transferencia pago')

    // Act
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location).toMatchObject({ pathname: '/', search: '?page=2' })
  })

  it('al cerrar un detalle abierto desde el dashboard vuelve a la entrada anterior del historial', async () => {
    // Arrange
    const { router, user } = renderAt('/?page=3')
    await router.navigate('/transactions/TXN-005?page=3')
    await screen.findByText('Transferencia pago')

    // Act
    await user.keyboard('{Escape}')

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location).toMatchObject({ pathname: '/', search: '?page=3' })
    expect(router.state.historyAction).toBe('POP')
  })
})
