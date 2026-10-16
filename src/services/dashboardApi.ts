import type {
  DashboardSummary,
  Period,
  TransactionDetail,
  TransactionList,
} from '../types/domain.ts'
import { httpClient } from './http/httpClient.ts'
import { mapSummary, mapTransactionDetail, mapTransactionList } from './mappers.ts'

// Devuelven modelos de dominio y rechazan siempre con `AppError`
// (interceptor de `httpClient` para errores HTTP; mappers para respuestas con forma inválida).

export const getSummary = async (period: Period, signal?: AbortSignal): Promise<DashboardSummary> => {
  const { data } = await httpClient.get<unknown>('/dashboard/summary', { params: { period }, signal })
  return mapSummary(data)
}

export const getTransactions = async (period: Period, signal?: AbortSignal): Promise<TransactionList> => {
  const { data } = await httpClient.get<unknown>('/dashboard/transaction/list', {
    params: { period },
    signal,
  })
  return mapTransactionList(data)
}

export const getTransactionById = async (
  id: string,
  signal?: AbortSignal,
): Promise<TransactionDetail> => {
  const { data } = await httpClient.get<unknown>(`/dashboard/transaction/${encodeURIComponent(id)}`, {
    signal,
  })
  return mapTransactionDetail(data)
}
