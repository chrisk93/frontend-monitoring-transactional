import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Transaction, TransactionFilters } from '../../../types/domain.ts'
import { TransactionsProvider } from '../context/TransactionsContext.tsx'
import { useTransactionsDispatch } from './useTransactionsDispatch.ts'
import { useVisibleTransactions } from './useVisibleTransactions.ts'

const buildTransactions = (count: number): Transaction[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `TXN-${String(index + 1).padStart(3, '0')}`,
    dateTime: '2026-07-23T12:00:00-05:00',
    type: index % 2 === 0 ? 'DEPOSIT' : 'TRANSFER',
    description: 'Movimiento',
    amount: 1000,
    currency: 'COP',
    status: 'COMPLETED',
    isAmountValid: true,
  }))

interface HookProps {
  filters: TransactionFilters
  page: number
}

/** Renderiza el selector con el estado global ya cargado con `items`. */
const renderWithItems = (items: Transaction[] | null, initialProps: HookProps) => {
  const hook = renderHook(
    ({ filters, page }: HookProps) => ({
      visible: useVisibleTransactions(filters, page),
      dispatch: useTransactionsDispatch(),
    }),
    { wrapper: TransactionsProvider, initialProps },
  )

  if (items) {
    act(() => hook.result.current.dispatch({ type: 'FETCH_SUCCESS', payload: { previousBalance: 0, items } }))
  }

  return hook
}

const ids = (items: readonly Transaction[]) => items.map(({ id }) => id)

describe('useVisibleTransactions', () => {
  it('pagina el listado completo cuando no hay filtros', () => {
    // Arrange / Act
    const { result } = renderWithItems(buildTransactions(45), { filters: {}, page: 1 })

    // Assert
    expect(result.current.visible.items).toHaveLength(20)
    expect(result.current.visible.totalPages).toBe(3)
    expect(result.current.visible.currentPage).toBe(1)
    expect(result.current.visible.emptyReason).toBeNull()
  })

  it('aplica los filtros antes de paginar', () => {
    // Arrange / Act: 45 transacciones, 22 son TRANSFER
    const { result } = renderWithItems(buildTransactions(45), { filters: { type: 'TRANSFER' }, page: 2 })

    // Assert
    expect(result.current.visible.totalPages).toBe(2)
    expect(ids(result.current.visible.items)).toEqual(['TXN-042', 'TXN-044'])
  })

  it('devuelve la página ajustada cuando la solicitada está fuera de rango', () => {
    // Arrange / Act
    const { result } = renderWithItems(buildTransactions(25), { filters: {}, page: 99 })

    // Assert
    expect(result.current.visible.currentPage).toBe(2)
    expect(result.current.visible.totalPages).toBe(2)
    expect(result.current.visible.items).toHaveLength(5)
  })

  it('recalcula al cambiar los filtros o la página', () => {
    // Arrange
    const { result, rerender } = renderWithItems(buildTransactions(45), { filters: {}, page: 3 })

    // Act
    rerender({ filters: { type: 'DEPOSIT' }, page: 1 })

    // Assert
    expect(result.current.visible.totalPages).toBe(2)
    expect(result.current.visible.items.every(({ type }) => type === 'DEPOSIT')).toBe(true)
  })

  it('indica empty-period cuando el período no tiene transacciones', () => {
    // Arrange / Act
    const { result } = renderWithItems([], { filters: {}, page: 1 })

    // Assert
    expect(result.current.visible.items).toEqual([])
    expect(result.current.visible.emptyReason).toBe('empty-period')
  })

  it('indica no-matches cuando hay transacciones pero ninguna coincide con los filtros', () => {
    // Arrange / Act
    const { result } = renderWithItems(buildTransactions(10), { filters: { status: 'REJECTED' }, page: 1 })

    // Assert
    expect(result.current.visible.items).toEqual([])
    expect(result.current.visible.emptyReason).toBe('no-matches')
  })

  it('devuelve una lista vacía mientras no hay datos cargados', () => {
    // Arrange / Act
    const { result } = renderWithItems(null, { filters: {}, page: 1 })

    // Assert
    expect(result.current.visible).toEqual({
      items: [],
      currentPage: 1,
      totalPages: 1,
      emptyReason: 'empty-period',
    })
  })
})
