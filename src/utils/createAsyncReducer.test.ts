import { describe, expect, it } from 'vitest'
import type { AppError } from '../shared/errors.ts'
import type { AsyncState } from '../types/domain.ts'
import { createAsyncReducer, createInitialAsyncState } from './createAsyncReducer.ts'
import type { AsyncAction } from './createAsyncReducer.ts'

const reducer = createAsyncReducer<string[]>()

const serverError: AppError = {
  kind: 'server',
  status: 500,
  message: 'El servicio no está disponible. Intenta más tarde.',
}

const succeededState: AsyncState<string[]> = {
  data: ['TXN-001'],
  status: 'succeeded',
  error: null,
}

describe('createInitialAsyncState', () => {
  it('crea un estado inicial sin datos ni error', () => {
    // Arrange / Act
    const state = createInitialAsyncState<string[]>()

    // Assert
    expect(state).toEqual({ data: null, status: 'idle', error: null })
  })
})

describe('createAsyncReducer', () => {
  it('FETCH_START pasa a loading y conserva los datos previos', () => {
    // Arrange
    const state = succeededState

    // Act
    const result = reducer(state, { type: 'FETCH_START' })

    // Assert
    expect(result).toEqual({ data: ['TXN-001'], status: 'loading', error: null })
  })

  it('FETCH_START limpia el error de un intento anterior', () => {
    // Arrange
    const state: AsyncState<string[]> = { data: null, status: 'failed', error: serverError }

    // Act
    const result = reducer(state, { type: 'FETCH_START' })

    // Assert
    expect(result.error).toBeNull()
    expect(result.status).toBe('loading')
  })

  it('FETCH_SUCCESS guarda los datos y limpia el error', () => {
    // Arrange
    const state: AsyncState<string[]> = { data: null, status: 'loading', error: serverError }

    // Act
    const result = reducer(state, { type: 'FETCH_SUCCESS', payload: ['TXN-002'] })

    // Assert
    expect(result).toEqual({ data: ['TXN-002'], status: 'succeeded', error: null })
  })

  it('FETCH_FAILURE guarda el error y conserva los datos previos', () => {
    // Arrange
    const state: AsyncState<string[]> = { data: ['TXN-001'], status: 'loading', error: null }

    // Act
    const result = reducer(state, { type: 'FETCH_FAILURE', error: serverError })

    // Assert
    expect(result).toEqual({ data: ['TXN-001'], status: 'failed', error: serverError })
  })

  it.each<AsyncAction<string[]>>([
    { type: 'FETCH_START' },
    { type: 'FETCH_SUCCESS', payload: ['TXN-002'] },
    { type: 'FETCH_FAILURE', error: serverError },
  ])('$type devuelve un estado nuevo sin modificar el anterior', (action) => {
    // Arrange
    const state = succeededState
    const snapshot = structuredClone(state)

    // Act
    const result = reducer(state, action)

    // Assert
    expect(result).not.toBe(state)
    expect(state).toEqual(snapshot)
  })
})
