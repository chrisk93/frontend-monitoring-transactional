import { useEffect, useReducer, useState } from 'react'
import { getSummary } from '../../../services/dashboardApi.ts'
import type { AsyncState, DashboardSummary, Period } from '../../../types/domain.ts'
import { createAsyncReducer, createInitialAsyncState } from '../../../utils/createAsyncReducer.ts'
import { runCancellableRequest } from '../../../utils/runCancellableRequest.ts'

export interface UseSummaryResult extends AsyncState<DashboardSummary> {
  retry: () => void
}

const summaryReducer = createAsyncReducer<DashboardSummary>()

/** Carga el resumen del período en estado local: solo lo usa `SummaryPanel` (DP-15). */
export const useSummary = (period: Period): UseSummaryResult => {
  const [state, dispatch] = useReducer(summaryReducer, createInitialAsyncState<DashboardSummary>())
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      dispatch({ type: 'FETCH_START' })
      await runCancellableRequest((signal) => getSummary(period, signal), controller.signal, dispatch)
    }

    void load()

    return () => controller.abort()
  }, [period, attempt])

  const retry = () => setAttempt((current) => current + 1)

  return { ...state, retry }
}
