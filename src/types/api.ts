import type {
  Channel,
  Currency,
  Period,
  TransactionStatus,
  TransactionType,
} from './domain.ts'

// Contrato esperado de la API. Las respuestas llegan como `unknown` y se validan en los mappers.

export interface TransactionDto {
  id: string
  dateTime: string
  type: TransactionType
  description: string
  amount: number
  currency: Currency
  status: TransactionStatus
}

export interface StatusChangeDto {
  status: TransactionStatus
  changedAt: string
}

export interface TransactionDetailDto extends TransactionDto {
  channel: Channel
  authorizationNumber: string
  receiptNumber: string
  statusHistory: StatusChangeDto[]
}

// GET /dashboard/summary?period=
export interface SummaryResponseDto {
  period: Period
  previousBalance: number
  currentBalance: number
  transactionCount: number
  pendingCount: number
  totalIncome: number
  totalExpense: number
}

// GET /dashboard/transaction/list?period=
export interface TransactionListResponseDto {
  previousBalance: number
  items: TransactionDto[]
}

// GET /dashboard/transaction/:id
export interface TransactionDetailResponseDto {
  previousBalance: number
  transaction: TransactionDetailDto
}
