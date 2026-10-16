import { describe, expect, it } from 'vitest'

describe('Infraestructura de pruebas', () => {
  it('ejecuta pruebas en un entorno DOM con los matchers de jest-dom', () => {
    // Arrange
    const element = document.createElement('p')
    element.textContent = 'Dashboard'

    // Act
    document.body.append(element)

    // Assert
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Dashboard')
  })
})
