import type { Transaction, TransactionFilters } from '../../../types/domain.ts'

type Predicate = (transaction: Transaction) => boolean

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** Convierte `YYYY-MM-DD` al inicio de ese día en la zona horaria local (A7). */
const parseLocalDate = (value: string): Date | null => {
  const match = DATE_PATTERN.exec(value)
  if (!match) return null

  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day)

  // `Date` desborda fechas inexistentes (2026-02-31 → 3 de marzo); se descartan.
  const isSameDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day

  return isSameDate ? date : null
}

const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)

/**
 * A2: límites inclusivos; `to` cubre el día completo. Si `from` > `to`, el rango no se aplica.
 */
const buildDateRangePredicate = (from?: string, to?: string): Predicate | null => {
  const start = from ? parseLocalDate(from) : null
  const end = to ? parseLocalDate(to) : null

  if (!start && !end) return null
  if (start && end && start > end) return null

  const endExclusive = end ? addDays(end, 1) : null

  return ({ dateTime }) => {
    const date = new Date(dateTime)
    return (!start || date >= start) && (!endExclusive || date < endExclusive)
  }
}

/**
 * RN-03: filtra localmente por rango de fechas, tipo y estado, combinados con AND.
 * No modifica la lista recibida.
 */
export const filterTransactions = (
  transactions: readonly Transaction[],
  { from, to, type, status }: TransactionFilters,
): Transaction[] => {
  const predicates = [
    buildDateRangePredicate(from, to),
    type ? (transaction: Transaction) => transaction.type === type : null,
    status ? (transaction: Transaction) => transaction.status === status : null,
  ].filter((predicate): predicate is Predicate => predicate !== null)

  return transactions.filter((transaction) =>
    predicates.every((predicate) => predicate(transaction)),
  )
}
