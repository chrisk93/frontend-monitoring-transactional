import { describe, expect, it } from 'vitest'
import { validateAmount } from './validateAmount.ts'

describe('validateAmount (RN-01)', () => {
  it.each([
    ['cero', 0],
    ['un monto intermedio con decimales', 3_500_000.5],
    ['el monto máximo permitido', 10_000_000],
  ])('acepta %s', (_description, amount) => {
    // Arrange: monto definido en la tabla

    // Act
    const result = validateAmount(amount)

    // Assert
    expect(result).toBe(true)
  })

  it.each([
    ['un monto negativo', -1],
    ['un monto que supera el máximo por un centavo', 10_000_000.01],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ])('rechaza %s', (_description, amount) => {
    // Arrange: monto definido en la tabla

    // Act
    const result = validateAmount(amount)

    // Assert
    expect(result).toBe(false)
  })
})
