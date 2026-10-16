import { describe, expect, it } from 'vitest'
import { formatDateTime } from './formatDateTime.ts'

// Las pruebas se ejecutan con TZ=America/Bogota (vitest.config.ts) para ser deterministas.
describe('formatDateTime', () => {
  it('muestra fecha y hora de una fecha ISO', () => {
    // Arrange
    const isoDate = '2026-07-21T09:15:00-05:00'

    // Act
    const result = formatDateTime(isoDate)

    // Assert
    expect(result).toBe('21/07/2026, 09:15')
  })

  it('usa formato de 24 horas', () => {
    // Arrange
    const isoDate = '2026-07-23T13:12:00-05:00'

    // Act
    const result = formatDateTime(isoDate)

    // Assert
    expect(result).toBe('23/07/2026, 13:12')
  })

  it('convierte una fecha UTC a la zona horaria local', () => {
    // Arrange
    const isoDate = '2026-07-22T03:30:00Z'

    // Act
    const result = formatDateTime(isoDate)

    // Assert
    expect(result).toBe('21/07/2026, 22:30')
  })

  it('devuelve el valor original si la fecha no es válida', () => {
    // Arrange
    const isoDate = 'fecha-invalida'

    // Act
    const result = formatDateTime(isoDate)

    // Assert
    expect(result).toBe('fecha-invalida')
  })
})
