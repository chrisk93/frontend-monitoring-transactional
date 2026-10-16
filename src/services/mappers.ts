import { validateAmount } from '../features/transactions/domain/validateAmount.ts'
import { INVALID_RESPONSE_MESSAGE } from '../shared/errors.ts'
import type { AppError } from '../shared/errors.ts'
import type {
  StatusChangeDto,
  SummaryResponseDto,
  TransactionDetailDto,
  TransactionDetailResponseDto,
  TransactionDto,
  TransactionListResponseDto,
} from '../types/api.ts'
import {
  CHANNELS,
  CURRENCIES,
  PERIODS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from '../types/domain.ts'
import type {
  DashboardSummary,
  Transaction,
  TransactionDetail,
  TransactionList,
} from '../types/domain.ts'
import { isNumber, isOneOf, isRecord, isString } from '../utils/typeGuards.ts'

// --- Type guards de los DTOs -------------------------------------------------------------------

const isPeriod = isOneOf(PERIODS)
const isTransactionType = isOneOf(TRANSACTION_TYPES)
const isTransactionStatus = isOneOf(TRANSACTION_STATUSES)
const isChannel = isOneOf(CHANNELS)
const isCurrency = isOneOf(CURRENCIES)

const isIsoDate = (value: unknown): value is string =>
  isString(value) && !Number.isNaN(Date.parse(value))

const isTransactionDto = (value: unknown): value is TransactionDto =>
  isRecord(value) &&
  isString(value.id) &&
  isIsoDate(value.dateTime) &&
  isTransactionType(value.type) &&
  isString(value.description) &&
  isNumber(value.amount) &&
  isCurrency(value.currency) &&
  isTransactionStatus(value.status)

const isStatusChangeDto = (value: unknown): value is StatusChangeDto =>
  isRecord(value) && isTransactionStatus(value.status) && isIsoDate(value.changedAt)

const isTransactionDetailDto = (value: unknown): value is TransactionDetailDto =>
  isRecord(value) &&
  isTransactionDto(value) &&
  isChannel(value.channel) &&
  isString(value.authorizationNumber) &&
  isString(value.receiptNumber) &&
  Array.isArray(value.statusHistory) &&
  value.statusHistory.every(isStatusChangeDto)

const isSummaryResponseDto = (value: unknown): value is SummaryResponseDto =>
  isRecord(value) &&
  isPeriod(value.period) &&
  isNumber(value.previousBalance) &&
  isNumber(value.currentBalance) &&
  isNumber(value.transactionCount) &&
  isNumber(value.pendingCount) &&
  isNumber(value.totalIncome) &&
  isNumber(value.totalExpense)

const isTransactionListResponseDto = (value: unknown): value is TransactionListResponseDto =>
  isRecord(value) &&
  isNumber(value.previousBalance) &&
  Array.isArray(value.items) &&
  value.items.every(isTransactionDto)

const isTransactionDetailResponseDto = (value: unknown): value is TransactionDetailResponseDto =>
  isRecord(value) && isNumber(value.previousBalance) && isTransactionDetailDto(value.transaction)

// --- Validación ---------------------------------------------------------------------------------

const INVALID_RESPONSE_ERROR: AppError = { kind: 'unknown', message: INVALID_RESPONSE_MESSAGE }

/** A6: una respuesta con forma inválida se rechaza con un `AppError` de tipo `unknown`. */
const assertShape = <T>(data: unknown, guard: (value: unknown) => value is T): T => {
  if (!guard(data)) throw { ...INVALID_RESPONSE_ERROR }
  return data
}

// --- DTO → dominio ------------------------------------------------------------------------------

const toTransaction = (dto: TransactionDto): Transaction => ({
  id: dto.id,
  dateTime: dto.dateTime,
  type: dto.type,
  description: dto.description,
  amount: dto.amount,
  currency: dto.currency,
  status: dto.status,
  isAmountValid: validateAmount(dto.amount), // RN-01 defensivo (DP-6)
})

const toTransactionDetail = (dto: TransactionDetailDto): TransactionDetail => ({
  ...toTransaction(dto),
  channel: dto.channel,
  authorizationNumber: dto.authorizationNumber,
  receiptNumber: dto.receiptNumber,
  statusHistory: dto.statusHistory.map(({ status, changedAt }) => ({ status, changedAt })),
})

export const mapSummary = (data: unknown): DashboardSummary => {
  const dto = assertShape(data, isSummaryResponseDto)

  return {
    period: dto.period,
    previousBalance: dto.previousBalance,
    currentBalance: dto.currentBalance,
    transactionCount: dto.transactionCount,
    pendingCount: dto.pendingCount,
    totalIncome: dto.totalIncome,
    totalExpense: dto.totalExpense,
  }
}

export const mapTransactionList = (data: unknown): TransactionList => {
  const dto = assertShape(data, isTransactionListResponseDto)

  return { previousBalance: dto.previousBalance, items: dto.items.map(toTransaction) }
}

export const mapTransactionDetail = (data: unknown): TransactionDetail => {
  const dto = assertShape(data, isTransactionDetailResponseDto)

  return toTransactionDetail(dto.transaction)
}
