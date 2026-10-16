import { validateAmount } from '../features/transactions/domain/validateAmount.ts'
import type { TransactionDto } from '../types/api.ts'
import type { CashFlow, TransactionType } from '../types/domain.ts'
import { roundToCents } from '../utils/roundToCents.ts'

// RN-02 en el backend simulado (A1): el frontend solo muestra los valores calculados aquí.

type CashFlowEntry = Pick<TransactionDto, 'type' | 'status' | 'amount'>

export interface CashFlowTotals {
  totalIncome: number
  totalExpense: number
}

const CASH_FLOW_BY_TYPE: Record<TransactionType, CashFlow> = {
  DEPOSIT: 'income',
  WITHDRAWAL: 'expense',
  TRANSFER: 'expense',
  SERVICE_PAYMENT: 'expense',
}

export const classifyCashFlow = (type: TransactionType): CashFlow => CASH_FLOW_BY_TYPE[type]

const affectsBalance = ({ status, amount }: CashFlowEntry): boolean =>
  status === 'COMPLETED' && validateAmount(amount)

/**
 * Suma ingresos y egresos considerando solo transacciones completadas con monto válido (RN-02, DP-6).
 */
export const summarizeCashFlow = (transactions: readonly CashFlowEntry[]): CashFlowTotals => {
  const totals = transactions.filter(affectsBalance).reduce<CashFlowTotals>(
    (accumulated, { type, amount }) =>
      classifyCashFlow(type) === 'income'
        ? { ...accumulated, totalIncome: accumulated.totalIncome + amount }
        : { ...accumulated, totalExpense: accumulated.totalExpense + amount },
    { totalIncome: 0, totalExpense: 0 },
  )

  return {
    totalIncome: roundToCents(totals.totalIncome),
    totalExpense: roundToCents(totals.totalExpense),
  }
}

/**
 * RN-02: saldo actual = saldo anterior + ingresos - egresos.
 */
export const calculateBalance = (
  previousBalance: number,
  totalIncome: number,
  totalExpense: number,
): number => roundToCents(previousBalance + totalIncome - totalExpense)
