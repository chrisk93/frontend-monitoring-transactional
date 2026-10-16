import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary, UNEXPECTED_ERROR_MESSAGE } from './AppErrorBoundary.tsx'

const Broken = (): never => {
  throw new Error('fallo de render')
}

describe('AppErrorBoundary', () => {
  it('muestra el contenido cuando no hay errores', () => {
    // Arrange / Act
    render(
      <AppErrorBoundary>
        <p>Contenido</p>
      </AppErrorBoundary>,
    )

    // Assert
    expect(screen.getByText('Contenido')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muestra un mensaje de respaldo si un hijo lanza un error de render', () => {
    // Arrange: React registra en consola el error capturado; se silencia para no ensuciar la salida
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    // Act
    render(
      <AppErrorBoundary>
        <Broken />
      </AppErrorBoundary>,
    )

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent(UNEXPECTED_ERROR_MESSAGE)
    consoleError.mockRestore()
  })
})
