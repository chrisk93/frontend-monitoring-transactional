import type { AppError } from '../../../shared/errors.ts'
import type { AsyncState, Period, TransactionList } from '../../../types/domain.ts'
import { createAsyncReducer, createInitialAsyncState } from '../../../utils/createAsyncReducer.ts'

export interface TransactionsState extends AsyncState<TransactionList> {
  /** Período de la última carga solicitada. */
  period: Period | null
}

export type TransactionsAction =
  | { type: 'FETCH_START'; period: Period }
  | { type: 'FETCH_SUCCESS'; payload: TransactionList }
  | { type: 'FETCH_FAILURE'; error: AppError }

export const initialTransactionsState: TransactionsState = {
  ...createInitialAsyncState<TransactionList>(),
  period: null,
}

const asyncReducer = createAsyncReducer<TransactionList>()

/** Reducer puro del estado global de transacciones (DESIGN §7). */
export const transactionsReducer = (
  state: TransactionsState,
  action: TransactionsAction,
): TransactionsState => ({
  ...asyncReducer(state, action),
  period: action.type === 'FETCH_START' ? action.period : state.period,
})
