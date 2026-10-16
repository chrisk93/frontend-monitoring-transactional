import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TransactionsProvider } from '../context/TransactionsContext.tsx'
import { initialTransactionsState } from '../context/transactionsReducer.ts'
import { useTransactionsState } from './useTransactionsState.ts'

describe('useTransactionsState', () => {
  it('devuelve el estado inicial dentro de TransactionsProvider', () => {
    // Arrange
    const wrapper = TransactionsProvider

    // Act
    const { result } = renderHook(() => useTransactionsState(), { wrapper })

    // Assert
    expect(result.current).toEqual(initialTransactionsState)
  })

  it('lanza un error descriptivo si se usa fuera de TransactionsProvider', () => {
    // Arrange: React registra en consola el error de render; se silencia para no ensuciar la salida
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    // Act
    const render = () => renderHook(() => useTransactionsState())

    // Assert
    expect(render).toThrow('useTransactionsState debe usarse dentro de <TransactionsProvider>')
    consoleError.mockRestore()
  })
})
