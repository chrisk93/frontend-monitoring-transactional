import type { AppError } from '../shared/errors.ts'

// Los arreglos `as const` son la fuente única de cada unión y permiten validar valores en tiempo de ejecución.
export const PERIODS = ['daily', 'weekly', 'monthly'] as const
export const TRANSACTION_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'SERVICE_PAYMENT'] as const
export const TRANSACTION_STATUSES = ['COMPLETED', 'PENDING', 'REJECTED', 'RETURNED'] as const
export const CHANNELS = ['MOBILE_APP', 'WEB', 'POINT_OF_SALE', 'BANK_TRANSFER'] as const
export const CURRENCIES = ['COP'] as const

export type Period = (typeof PERIODS)[number]
export type TransactionType = (typeof TRANSACTION_TYPES)[number]
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number]
export type Channel = (typeof CHANNELS)[number]
export type Currency = (typeof CURRENCIES)[number]
export type CashFlow = 'income' | 'expense' // DEPOSIT → income; WITHDRAWAL, TRANSFER, SERVICE_PAYMENT → expense

export interface Transaction {
  id: string
  dateTime: string // ISO 8601
  type: TransactionType
  description: string
  amount: number
  currency: Currency
  status: TransactionStatus
  isAmountValid: boolean // resultado de RN-01 (DP-6)
}

export interface StatusChange {
  status: TransactionStatus
  changedAt: string // ISO 8601
}

export interface TransactionDetail extends Transaction {
  channel: Channel
  authorizationNumber: string
  receiptNumber: string
  statusHistory: readonly StatusChange[]
}

export interface DashboardSummary {
  period: Period
  previousBalance: number
  currentBalance: number // calculado por el backend (A1)
  transactionCount: number
  pendingCount: number
  totalIncome: number
  totalExpense: number
}

export interface TransactionList {
  previousBalance: number
  items: readonly Transaction[]
}

export interface TransactionFilters {
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
  type?: TransactionType
  status?: TransactionStatus
}

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export interface AsyncState<T> {
  data: T | null
  status: RequestStatus
  error: AppError | null
}
