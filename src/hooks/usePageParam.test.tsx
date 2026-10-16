import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation, useNavigationType } from 'react-router'
import { describe, expect, it } from 'vitest'
import { usePageParam } from './usePageParam.ts'

const renderUsePageParam = (initialUrl: string) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>
  )

  return renderHook(
    () => ({ ...usePageParam(), location: useLocation(), navigationType: useNavigationType() }),
    { wrapper },
  )
}

describe('usePageParam', () => {
  it('devuelve la página 1 cuando no hay parámetro', () => {
    // Arrange / Act
    const { result } = renderUsePageParam('/')

    // Assert
    expect(result.current.page).toBe(1)
  })

  it('lee una página válida de la URL', () => {
    // Arrange / Act
    const { result } = renderUsePageParam('/?page=3')

    // Assert
    expect(result.current.page).toBe(3)
  })

  it.each(['abc', '0', '-2', '1.5', '', '03', '2abc'])('devuelve la página 1 con page=%s', (value) => {
    // Arrange / Act
    const { result } = renderUsePageParam(`/?page=${value}`)

    // Assert
    expect(result.current.page).toBe(1)
  })

  it('setPage escribe la página en la URL y agrega una entrada al historial', () => {
    // Arrange
    const { result } = renderUsePageParam('/')

    // Act
    act(() => result.current.setPage(2))

    // Assert
    expect(result.current.page).toBe(2)
    expect(result.current.location.search).toBe('?page=2')
    expect(result.current.navigationType).toBe('PUSH')
  })

  it('setPage(1) elimina el parámetro', () => {
    // Arrange
    const { result } = renderUsePageParam('/?page=4')

    // Act
    act(() => result.current.setPage(1))

    // Assert
    expect(result.current.page).toBe(1)
    expect(result.current.location.search).toBe('')
  })

  it('setPage con replace no agrega una entrada al historial', () => {
    // Arrange
    const { result } = renderUsePageParam('/?page=9')

    // Act
    act(() => result.current.setPage(3, { replace: true }))

    // Assert
    expect(result.current.location.search).toBe('?page=3')
    expect(result.current.navigationType).toBe('REPLACE')
  })

  it('conserva la ruta y los demás parámetros de la URL', () => {
    // Arrange
    const { result } = renderUsePageParam('/transactions/TXN-005?page=2&origen=tabla')

    // Act
    act(() => result.current.setPage(5))

    // Assert
    expect(result.current.location.pathname).toBe('/transactions/TXN-005')
    expect(result.current.location.search).toBe('?page=5&origen=tabla')
  })

  it.each([0, -3, 2.5, Number.NaN])('setPage(%s) se trata como la página 1', (page) => {
    // Arrange
    const { result } = renderUsePageParam('/?page=4')

    // Act
    act(() => result.current.setPage(page))

    // Assert
    expect(result.current.location.search).toBe('')
  })
})
