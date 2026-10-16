import type { AppError } from '../shared/errors.ts'
import type { AsyncState } from '../types/domain.ts'

export type AsyncAction<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: T }
  | { type: 'FETCH_FAILURE'; error: AppError }

export const createInitialAsyncState = <T>(): AsyncState<T> => ({
  data: null,
  status: 'idle',
  error: null,
})

/**
 * Crea un reducer puro para el ciclo de una petición (carga → éxito | error).
 * Conserva los datos previos durante una recarga y ante un error (DESIGN §9).
 */
export const createAsyncReducer =
  <T>() =>
  (state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> => {
    switch (action.type) {
      case 'FETCH_START':
        return { ...state, status: 'loading', error: null }
      case 'FETCH_SUCCESS':
        return { data: action.payload, status: 'succeeded', error: null }
      case 'FETCH_FAILURE':
        return { ...state, status: 'failed', error: action.error }
    }
  }
