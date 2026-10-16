import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { StatusChange } from '../../../../types/domain.ts'
import { StatusHistory } from './StatusHistory.tsx'

describe('StatusHistory', () => {
  it('muestra los cambios de estado en orden cronológico aunque lleguen desordenados', () => {
    // Arrange
    const history: StatusChange[] = [
      { status: 'RETURNED', changedAt: '2026-07-21T09:45:00-05:00' },
      { status: 'PENDING', changedAt: '2026-07-21T09:15:00-05:00' },
      { status: 'COMPLETED', changedAt: '2026-07-21T09:16:00-05:00' },
    ]

    // Act
    render(<StatusHistory history={history} />)

    // Assert
    const items = within(screen.getByRole('list', { name: 'Historial de cambios de estado' })).getAllByRole(
      'listitem',
    )
    expect(items.map((item) => item.textContent)).toEqual([
      'Pendiente21/07/2026, 09:15',
      'Completada21/07/2026, 09:16',
      'Devuelta21/07/2026, 09:45',
    ])
  })

  it('expone la fecha original en un elemento time', () => {
    // Arrange
    const history: StatusChange[] = [{ status: 'PENDING', changedAt: '2026-07-23T12:11:00-05:00' }]

    // Act
    render(<StatusHistory history={history} />)

    // Assert
    expect(screen.getByText('23/07/2026, 12:11')).toHaveAttribute('dateTime', '2026-07-23T12:11:00-05:00')
  })

  it('no modifica el historial recibido', () => {
    // Arrange
    const history: StatusChange[] = [
      { status: 'COMPLETED', changedAt: '2026-07-21T09:16:00-05:00' },
      { status: 'PENDING', changedAt: '2026-07-21T09:15:00-05:00' },
    ]
    const snapshot = structuredClone(history)

    // Act
    render(<StatusHistory history={history} />)

    // Assert
    expect(history).toEqual(snapshot)
  })
})
