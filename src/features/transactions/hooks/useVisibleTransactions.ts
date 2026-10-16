import type { Transaction, TransactionFilters } from '../../../types/domain.ts'
import { paginate } from '../../../utils/paginate.ts'
import { filterTransactions } from '../domain/filterTransactions.ts'
import { useTransactionsState } from './useTransactionsState.ts'

/** Motivo de una lista vacía: no hay datos en el período o ninguno coincide con los filtros. */
export type EmptyReason = 'empty-period' | 'no-matches'

export interface VisibleTransactions {
  items: Transaction[]
  currentPage: number
  totalPages: number
  emptyReason: EmptyReason | null
}

const getEmptyReason = (loaded: number, matching: number): EmptyReason | null => {
  if (loaded === 0) return 'empty-period'
  if (matching === 0) return 'no-matches'
  return null
}

/**
 * Selector del listado visible: aplica los filtros (RN-03, AND) y luego pagina. `currentPage` es la
 * página ajustada al rango válido, que puede diferir de la solicitada.
 */
export const useVisibleTransactions = (filters: TransactionFilters, page: number): VisibleTransactions => {
  const { data } = useTransactionsState()
  const loaded = data?.items ?? []
  const matching = filterTransactions(loaded, filters)
  const { items, currentPage, totalPages } = paginate(matching, page)

  return {
    items,
    currentPage,
    totalPages,
    emptyReason: getEmptyReason(loaded.length, matching.length),
  }
}
