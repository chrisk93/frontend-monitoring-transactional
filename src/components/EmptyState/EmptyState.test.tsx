import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState.tsx'

describe('EmptyState', () => {
  it('muestra el mensaje recibido', () => {
    // Arrange / Act
    render(<EmptyState message="No hay transacciones en este período" />)

    // Assert
    expect(screen.getByText('No hay transacciones en este período')).toBeInTheDocument()
  })
})
