import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { INVALID_RANGE_MESSAGE, TransactionFilters } from './TransactionFilters.tsx'

const renderFilters = () => {
  const onChange = vi.fn()
  render(<TransactionFilters onChange={onChange} />)
  return { onChange, user: userEvent.setup() }
}

// user-event no escribe de forma fiable en inputs de tipo date en jsdom; se usa el evento change.
const setDate = (label: 'Desde' | 'Hasta', value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

const lastEmitted = (onChange: ReturnType<typeof vi.fn>) => onChange.mock.lastCall?.[0]

describe('TransactionFilters (RF-02)', () => {
  it('muestra los filtros de rango de fechas, tipo y estado', () => {
    // Arrange / Act
    renderFilters()

    // Assert
    expect(screen.getByRole('form', { name: 'Filtros de transacciones' })).toBeInTheDocument()
    expect(screen.getByLabelText('Desde')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('Hasta')).toHaveAttribute('type', 'date')
    expect(screen.getByRole('combobox', { name: 'Tipo' })).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue('')
  })

  it('ofrece todos los tipos y estados con etiquetas en español', () => {
    // Arrange / Act
    renderFilters()

    // Assert
    const optionsOf = (name: string) =>
      within(screen.getByRole('combobox', { name }))
        .getAllByRole('option')
        .map((option) => option.textContent)
    expect(optionsOf('Tipo')).toEqual(['Todos', 'Depósito', 'Retiro', 'Transferencia', 'Pago de servicio'])
    expect(optionsOf('Estado')).toEqual(['Todos', 'Completada', 'Pendiente', 'Rechazada', 'Devuelta'])
  })

  it('emite el tipo seleccionado', async () => {
    // Arrange
    const { onChange, user } = renderFilters()

    // Act
    await user.selectOptions(screen.getByRole('combobox', { name: 'Tipo' }), 'Transferencia')

    // Assert
    expect(lastEmitted(onChange)).toEqual({ type: 'TRANSFER' })
  })

  it('combina los filtros en cada cambio (AND)', async () => {
    // Arrange
    const { onChange, user } = renderFilters()

    // Act
    await user.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'Pendiente')
    setDate('Desde', '2026-07-21')
    setDate('Hasta', '2026-07-23')

    // Assert
    expect(lastEmitted(onChange)).toEqual({ status: 'PENDING', from: '2026-07-21', to: '2026-07-23' })
    expect(onChange).toHaveBeenCalledTimes(3)
  })

  it('volver a "Todos" quita el filtro', async () => {
    // Arrange
    const { onChange, user } = renderFilters()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Tipo' }), 'Retiro')

    // Act
    await user.selectOptions(screen.getByRole('combobox', { name: 'Tipo' }), 'Todos')

    // Assert
    expect(lastEmitted(onChange)).toEqual({})
  })

  it('con un rango invertido muestra el mensaje y no emite las fechas (A2)', async () => {
    // Arrange
    const { onChange, user } = renderFilters()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Tipo' }), 'Depósito')

    // Act
    setDate('Desde', '2026-07-23')
    setDate('Hasta', '2026-07-21')

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent(INVALID_RANGE_MESSAGE)
    expect(INVALID_RANGE_MESSAGE).toBe('La fecha inicial no puede ser mayor que la final')
    expect(lastEmitted(onChange)).toEqual({ type: 'DEPOSIT' })
    expect(screen.getByLabelText('Hasta')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-07-21')
  })

  it('al corregir el rango oculta el mensaje y vuelve a emitir las fechas', () => {
    // Arrange
    const { onChange } = renderFilters()
    setDate('Desde', '2026-07-23')
    setDate('Hasta', '2026-07-21')

    // Act
    setDate('Hasta', '2026-07-25')

    // Assert
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(lastEmitted(onChange)).toEqual({ from: '2026-07-23', to: '2026-07-25' })
  })

  it('acepta un rango de un solo día', () => {
    // Arrange
    const { onChange } = renderFilters()

    // Act
    setDate('Desde', '2026-07-22')
    setDate('Hasta', '2026-07-22')

    // Assert
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(lastEmitted(onChange)).toEqual({ from: '2026-07-22', to: '2026-07-22' })
  })
})
