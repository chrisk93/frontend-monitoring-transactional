import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PeriodSelector } from './PeriodSelector.tsx'

describe('PeriodSelector', () => {
  it('ofrece los 3 períodos dentro de un grupo accesible', () => {
    // Arrange / Act
    render(<PeriodSelector value="monthly" onChange={vi.fn()} />)

    // Assert
    const group = screen.getByRole('group', { name: 'Período' })
    expect(group).toBeInTheDocument()
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Diario',
      'Semanal',
      'Mensual',
    ])
  })

  it('marca la opción activa con aria-pressed', () => {
    // Arrange / Act
    render(<PeriodSelector value="weekly" onChange={vi.fn()} />)

    // Assert
    expect(screen.getByRole('button', { name: 'Semanal' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Diario' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Mensual' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('emite el período elegido', async () => {
    // Arrange
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<PeriodSelector value="monthly" onChange={onChange} />)

    // Act
    await user.click(screen.getByRole('button', { name: 'Diario' }))

    // Assert
    expect(onChange).toHaveBeenCalledExactlyOnceWith('daily')
  })
})
