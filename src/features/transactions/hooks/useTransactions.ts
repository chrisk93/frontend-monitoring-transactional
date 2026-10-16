import { useEffect, useState } from 'react'
import { getTransactions } from '../../../services/dashboardApi.ts'
import type { Period } from '../../../types/domain.ts'
import { runCancellableRequest } from '../../../utils/runCancellableRequest.ts'
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
      await runCancellableRequest((signal) => getTransactions(period, signal), controller.signal, dispatch)
    }

    void load()

    return () => controller.abort()
  }, [period, attempt, dispatch])

  const retry = () => setAttempt((current) => current + 1)

  return { ...state, retry }
}
