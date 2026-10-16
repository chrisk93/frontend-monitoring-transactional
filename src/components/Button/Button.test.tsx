import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button.tsx'

describe('Button', () => {
  it('es de tipo button por defecto para no enviar formularios', () => {
    // Arrange / Act
    render(<Button>Aplicar</Button>)

    // Assert
    expect(screen.getByRole('button', { name: 'Aplicar' })).toHaveAttribute('type', 'button')
  })

  it('ejecuta onClick al hacer clic', async () => {
    // Arrange
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Aplicar</Button>)

    // Act
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    // Assert
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('no ejecuta onClick cuando está deshabilitado', async () => {
    // Arrange
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <Button onClick={onClick} disabled>
        Aplicar
      </Button>,
    )

    // Act
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    // Assert
    expect(onClick).not.toHaveBeenCalled()
  })

  it('reenvía los atributos nativos del botón', () => {
    // Arrange / Act
    render(<Button aria-label="Cerrar detalle">×</Button>)

    // Assert
    expect(screen.getByRole('button', { name: 'Cerrar detalle' })).toBeInTheDocument()
  })
})
