import { normalizeError } from '../services/http/normalizeError.ts'
import type { AsyncAction } from './createAsyncReducer.ts'

export type AsyncResultAction<T> = Exclude<AsyncAction<T>, { type: 'FETCH_START' }>

/**
 * Ejecuta una petición cancelable y despacha su resultado. No despacha nada si la señal se abortó:
 * una respuesta antigua nunca reemplaza a la más reciente y la cancelación no se reporta como error.
 */
export const runCancellableRequest = async <T>(
  request: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  dispatch: (action: AsyncResultAction<T>) => void,
): Promise<void> => {
  try {
    const payload = await request(signal)
    if (!signal.aborted) dispatch({ type: 'FETCH_SUCCESS', payload })
  } catch (error) {
    const appError = normalizeError(error)
    if (appError.kind !== 'cancelled' && !signal.aborted) {
      dispatch({ type: 'FETCH_FAILURE', error: appError })
    }
  }
}
