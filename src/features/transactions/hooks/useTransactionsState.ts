import { use } from 'react'
import { TransactionsStateContext } from '../context/transactionsContexts.ts'
import type { TransactionsState } from '../context/transactionsReducer.ts'

/** Lee el estado global de transacciones. Debe usarse dentro de `TransactionsProvider`. */
export const useTransactionsState = (): TransactionsState => {
  const state = use(TransactionsStateContext)

  if (state === null) {
    throw new Error('useTransactionsState debe usarse dentro de <TransactionsProvider>')
  }

  return state
}
