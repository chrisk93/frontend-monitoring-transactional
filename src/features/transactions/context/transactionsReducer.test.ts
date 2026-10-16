import { describe, expect, it } from 'vitest'
import type { AppError } from '../../../shared/errors.ts'
import type { TransactionList } from '../../../types/domain.ts'
import { initialTransactionsState, transactionsReducer } from './transactionsReducer.ts'
import type { TransactionsAction, TransactionsState } from './transactionsReducer.ts'

const list: TransactionList = {
  previousBalance: 1_000_000,
  items: [
    {
      id: 'TXN-001',
      dateTime: '2026-07-21T09:15:00-05:00',
      type: 'DEPOSIT',
      description: 'Pago de nómina quincenal',
      amount: 10_000_000,
      currency: 'COP',
      status: 'COMPLETED',
      isAmountValid: true,
    },
  ],
}

const serverError: AppError = {
  kind: 'server',
  status: 500,
  message: 'El servicio no está disponible. Intenta más tarde.',
}

const loadedState: TransactionsState = { data: list, status: 'succeeded', error: null, period: 'monthly' }

describe('transactionsReducer', () => {
  it('parte de un estado inicial sin datos ni período', () => {
    // Arrange / Act
    const state = initialTransactionsState

    // Assert
    expect(state).toEqual({ data: null, status: 'idle', error: null, period: null })
  })

  it('FETCH_START registra el período, pasa a loading y conserva los datos previos', () => {
    // Arrange
    const state = loadedState

    // Act
    const result = transactionsReducer(state, { type: 'FETCH_START', period: 'daily' })

    // Assert
    expect(result).toEqual({ data: list, status: 'loading', error: null, period: 'daily' })
  })

  it('FETCH_SUCCESS guarda el listado y conserva el período solicitado', () => {
    // Arrange
    const state: TransactionsState = { ...initialTransactionsState, status: 'loading', period: 'weekly' }

    // Act
    const result = transactionsReducer(state, { type: 'FETCH_SUCCESS', payload: list })

    // Assert
    expect(result).toEqual({ data: list, status: 'succeeded', error: null, period: 'weekly' })
  })

  it('FETCH_FAILURE guarda el error, conserva los datos previos y el período', () => {
    // Arrange
    const state: TransactionsState = { ...loadedState, status: 'loading' }

    // Act
    const result = transactionsReducer(state, { type: 'FETCH_FAILURE', error: serverError })

    // Assert
    expect(result).toEqual({ data: list, status: 'failed', error: serverError, period: 'monthly' })
  })

  it.each<TransactionsAction>([
    { type: 'FETCH_START', period: 'daily' },
    { type: 'FETCH_SUCCESS', payload: list },
    { type: 'FETCH_FAILURE', error: serverError },
  ])('$type devuelve un estado nuevo sin modificar el anterior', (action) => {
    // Arrange
    const state = loadedState
    const snapshot = structuredClone(state)

    // Act
    const result = transactionsReducer(state, action)

    // Assert
    expect(result).not.toBe(state)
    expect(state).toEqual(snapshot)
  })
})
