import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination.tsx'

const renderPagination = (currentPage: number, totalPages: number) => {
  const onPageChange = vi.fn()
  const view = render(
    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />,
  )
  return { ...view, onPageChange, user: userEvent.setup() }
}

describe('Pagination', () => {
  it('muestra un botón por página dentro de una navegación accesible', () => {
    // Arrange / Act
    renderPagination(2, 3)

    // Assert
    const navigation = screen.getByRole('navigation', { name: 'Paginación' })
    expect(navigation).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Página/ })).toHaveLength(3)
  })

  it('marca la página actual con aria-current', () => {
    // Arrange / Act
    renderPagination(2, 3)

    // Assert
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Página 1' })).not.toHaveAttribute('aria-current')
  })

  it('deshabilita Anterior en la primera página', () => {
    // Arrange / Act
    renderPagination(1, 3)

    // Assert
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
  })

  it('deshabilita Siguiente en la última página', () => {
    // Arrange / Act
    renderPagination(3, 3)

    // Assert
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
  })

  it.each([
    ['Anterior', 1],
    ['Siguiente', 3],
    ['Página 3', 3],
  ])('el botón %s solicita la página %i', async (name, expectedPage) => {
    // Arrange
    const { onPageChange, user } = renderPagination(2, 3)

    // Act
    await user.click(screen.getByRole('button', { name }))

    // Assert
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(expectedPage)
  })

  it.each([1, 0])('no se muestra con %i páginas (A4)', (totalPages) => {
    // Arrange / Act
    const { container } = renderPagination(1, totalPages)

    // Assert
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
