import { describe, expect, it } from 'vitest'
import { paginate } from './paginate.ts'

const range = (length: number): number[] => Array.from({ length }, (_, index) => index + 1)

describe('paginate (RN-03)', () => {
  it('usa 20 registros por página por defecto', () => {
    // Arrange
    const items = range(45)

    // Act
    const result = paginate(items, 1)

    // Assert
    expect(result.items).toEqual(range(20))
    expect(result.totalPages).toBe(3)
  })

  it('devuelve una página vacía cuando no hay elementos', () => {
    // Arrange
    const items: number[] = []

    // Act
    const result = paginate(items, 1)

    // Assert
    expect(result).toEqual({ items: [], totalPages: 1, currentPage: 1 })
  })

  it('devuelve una sola página con exactamente 20 elementos', () => {
    // Arrange
    const items = range(20)

    // Act
    const result = paginate(items, 1)

    // Assert
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(20)
  })

  it('devuelve 2 páginas con 21 elementos y 1 elemento en la segunda', () => {
    // Arrange
    const items = range(21)

    // Act
    const result = paginate(items, 2)

    // Assert
    expect(result).toEqual({ items: [21], totalPages: 2, currentPage: 2 })
  })

  it('ajusta a la última página una página mayor que el total', () => {
    // Arrange
    const items = range(45)

    // Act
    const result = paginate(items, 99)

    // Assert
    expect(result.currentPage).toBe(3)
    expect(result.items).toEqual([41, 42, 43, 44, 45])
  })

  it.each([
    ['cero', 0],
    ['un número negativo', -2],
    ['NaN', Number.NaN],
  ])('ajusta a la primera página una página igual a %s', (_description, page) => {
    // Arrange
    const items = range(45)

    // Act
    const result = paginate(items, page)

    // Assert
    expect(result.currentPage).toBe(1)
    expect(result.items).toEqual(range(20))
  })

  it('trunca una página con decimales', () => {
    // Arrange
    const items = range(45)

    // Act
    const result = paginate(items, 2.7)

    // Assert
    expect(result.currentPage).toBe(2)
  })

  it('respeta un tamaño de página personalizado', () => {
    // Arrange
    const items = range(5)

    // Act
    const result = paginate(items, 2, 2)

    // Assert
    expect(result).toEqual({ items: [3, 4], totalPages: 3, currentPage: 2 })
  })

  it('no modifica la lista recibida', () => {
    // Arrange
    const items = range(25)
    const snapshot = [...items]

    // Act
    paginate(items, 2)

    // Assert
    expect(items).toEqual(snapshot)
  })
})
