import { useEffect, useReducer, useState } from 'react'
import { getTransactionById } from '../../../services/dashboardApi.ts'
import type { AsyncState, TransactionDetail } from '../../../types/domain.ts'
import { createAsyncReducer, createInitialAsyncState } from '../../../utils/createAsyncReducer.ts'
import { runCancellableRequest } from '../../../utils/runCancellableRequest.ts'

export interface UseTransactionDetailResult extends AsyncState<TransactionDetail> {
  retry: () => void
}

const detailReducer = createAsyncReducer<TransactionDetail>()

/** Carga el detalle de una transacción en estado local: solo lo usa el modal (DP-15). */
export const useTransactionDetail = (id: string): UseTransactionDetailResult => {
  const [state, dispatch] = useReducer(detailReducer, createInitialAsyncState<TransactionDetail>())
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      dispatch({ type: 'FETCH_START' })
      await runCancellableRequest((signal) => getTransactionById(id, signal), controller.signal, dispatch)
    }

    void load()

    return () => controller.abort()
  }, [id, attempt])

  const retry = () => setAttempt((current) => current + 1)

  return { ...state, retry }
}
