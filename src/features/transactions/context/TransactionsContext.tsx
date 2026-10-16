import { useReducer } from 'react'
import type { ReactNode } from 'react'
import { TransactionsDispatchContext, TransactionsStateContext } from './transactionsContexts.ts'
import { initialTransactionsState, transactionsReducer } from './transactionsReducer.ts'

interface TransactionsProviderProps {
  children: ReactNode
}

export const TransactionsProvider = ({ children }: TransactionsProviderProps) => {
  const [state, dispatch] = useReducer(transactionsReducer, initialTransactionsState)

  return (
    <TransactionsStateContext value={state}>
      <TransactionsDispatchContext value={dispatch}>{children}</TransactionsDispatchContext>
    </TransactionsStateContext>
  )
}
