import { createContext } from 'react'
import type { Dispatch } from 'react'
import type { TransactionsAction, TransactionsState } from './transactionsReducer.ts'

export const TransactionsStateContext = createContext<TransactionsState | null>(null)

export const TransactionsDispatchContext = createContext<Dispatch<TransactionsAction> | null>(null)
