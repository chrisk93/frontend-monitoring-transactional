import { AxiosError, isAxiosError, isCancel } from 'axios'
import { APP_ERROR_KINDS, ERROR_MESSAGES } from '../../shared/errors.ts'
import type { AppError, AppErrorKind } from '../../shared/errors.ts'

const TIMEOUT_CODES: readonly (string | undefined)[] = [AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT]

const createAppError = (kind: AppErrorKind, status?: number): AppError => ({
  kind,
  message: ERROR_MESSAGES[kind],
  ...(status === undefined ? {} : { status }),
})

const kindFromStatus = (status: number): AppErrorKind => {
  if (status === 404) return 'not_found'
  if (status >= 400 && status < 500) return 'client'
  if (status >= 500) return 'server'
  return 'unknown'
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isAppError = (value: unknown): value is AppError =>
  isRecord(value) &&
  typeof value.message === 'string' &&
  APP_ERROR_KINDS.some((kind) => kind === value.kind)

/**
 * Manejo centralizado de errores: convierte cualquier fallo en un `AppError` con un mensaje en
 * español apto para el usuario (DESIGN §6). Un `AppError` ya normalizado se devuelve sin cambios.
 */
export const normalizeError = (error: unknown): AppError => {
  if (isAppError(error)) return error
  if (isCancel(error)) return createAppError('cancelled')
  if (!isAxiosError(error)) return createAppError('unknown')

  if (error.response) return createAppError(kindFromStatus(error.response.status), error.response.status)
  if (TIMEOUT_CODES.includes(error.code)) return createAppError('timeout')

  return createAppError('network')
}
