import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge.tsx'

describe('StatusBadge', () => {
  it.each([
    ['COMPLETED', 'Completada'],
    ['PENDING', 'Pendiente'],
    ['REJECTED', 'Rechazada'],
    ['RETURNED', 'Devuelta'],
  ] as const)('muestra el estado %s como texto: %s', (status, label) => {
    // Arrange / Act
    render(<StatusBadge status={status} />)

    // Assert
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
