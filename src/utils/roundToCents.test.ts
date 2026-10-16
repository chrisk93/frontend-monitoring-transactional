import { describe, expect, it } from 'vitest'
import { roundToCents } from './roundToCents.ts'

describe('roundToCents (DP-10)', () => {
  it.each([
    ['un entero sin cambios', 1500, 1500],
    ['hacia arriba desde el tercer decimal', 1234.567, 1234.57],
    ['hacia abajo desde el tercer decimal', 1234.561, 1234.56],
    ['el error de punto flotante de una suma', 0.1 + 0.2, 0.3],
  ])('redondea %s', (_description, value, expected) => {
    // Arrange: valores definidos en la tabla

    // Act
    const result = roundToCents(value)

    // Assert
    expect(result).toBe(expected)
  })
})
