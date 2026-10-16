import { use } from 'react'
import type { Dispatch } from 'react'
import { TransactionsDispatchContext } from '../context/transactionsContexts.ts'
import type { TransactionsAction } from '../context/transactionsReducer.ts'

export const useTransactionsDispatch = (): Dispatch<TransactionsAction> => {
  const dispatch = use(TransactionsDispatchContext)

  if (dispatch === null) {
    throw new Error('useTransactionsDispatch debe usarse dentro de <TransactionsProvider>')
  }

  return dispatch
}
