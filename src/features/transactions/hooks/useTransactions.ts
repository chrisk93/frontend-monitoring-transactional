import { useEffect, useState } from 'react'
import { getTransactions } from '../../../services/dashboardApi.ts'
import { normalizeError } from '../../../services/http/normalizeError.ts'
import type { Period } from '../../../types/domain.ts'
import type { TransactionsState } from '../context/transactionsReducer.ts'
import { useTransactionsDispatch } from './useTransactionsDispatch.ts'
import { useTransactionsState } from './useTransactionsState.ts'

export interface UseTransactionsResult extends TransactionsState {
  retry: () => void
}

/**
 * Carga el listado del período en el estado global. Al cambiar el período o desmontarse cancela la
 * petición en curso, de modo que una respuesta antigua nunca reemplaza a la más reciente.
 */
export const useTransactions = (period: Period): UseTransactionsResult => {
  const state = useTransactionsState()
  const dispatch = useTransactionsDispatch()
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      dispatch({ type: 'FETCH_START', period })

      try {
        const payload = await getTransactions(period, controller.signal)
        if (!controller.signal.aborted) dispatch({ type: 'FETCH_SUCCESS', payload })
      } catch (error) {
        const appError = normalizeError(error)
        if (appError.kind !== 'cancelled' && !controller.signal.aborted) {
          dispatch({ type: 'FETCH_FAILURE', error: appError })
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [period, attempt, dispatch])

  const retry = () => setAttempt((current) => current + 1)

  return { ...state, retry }
}
