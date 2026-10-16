import { describe, expect, it } from 'vitest'
import { formatCurrency } from './formatCurrency.ts'

describe('formatCurrency (RN-05)', () => {
  it('formatea un monto entero sin decimales', () => {
    // Arrange
    const amount = 1234567

    // Act
    const result = formatCurrency(amount)

    // Assert
    expect(result).toBe('$1.234.567 COP')
  })

  it('formatea un monto con decimales usando siempre 2 dígitos', () => {
    // Arrange
    const amount = 1234567.1

    // Act
    const result = formatCurrency(amount)

    // Assert
    expect(result).toBe('$1.234.567,10 COP')
  })

  it('formatea cero', () => {
    // Arrange
    const amount = 0

    // Act
    const result = formatCurrency(amount)

    // Assert
    expect(result).toBe('$0 COP')
  })

  it('formatea el monto máximo permitido', () => {
    // Arrange
    const amount = 10_000_000

    // Act
    const result = formatCurrency(amount)

    // Assert
    expect(result).toBe('$10.000.000 COP')
  })

  it('aplica separador de miles a montos de 4 dígitos', () => {
    // Arrange
    const amount = 1234

    // Act
    const result = formatCurrency(amount)

    // Assert
    expect(result).toBe('$1.234 COP')
  })

  it('redondea a 2 decimales un monto con más decimales', () => {
    // Arrange
    const amount = 1234.567

    // Act
    const result = formatCurrency(amount)

    // Assert
    expect(result).toBe('$1.234,57 COP')
  })

  it('muestra sin decimales un monto que al redondearse queda entero', () => {
    // Arrange
    const amount = 999.999

    // Act
    const result = formatCurrency(amount)

    // Assert
    expect(result).toBe('$1.000 COP')
  })

  it('antepone el signo a un monto negativo', () => {
    // Arrange
    const amount = -1500.5

    // Act
    const result = formatCurrency(amount)

    // Assert
    expect(result).toBe('-$1.500,50 COP')
  })
})
