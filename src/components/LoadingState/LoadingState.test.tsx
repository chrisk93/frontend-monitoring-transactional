import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoadingState } from './LoadingState.tsx'

describe('LoadingState', () => {
  it('anuncia la carga con role="status" y aria-busy', () => {
    // Arrange / Act
    render(<LoadingState />)

    // Assert
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveTextContent('Cargando…')
  })

  it('muestra un mensaje personalizado', () => {
    // Arrange / Act
    render(<LoadingState message="Cargando transacciones…" />)

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('Cargando transacciones…')
  })
})
