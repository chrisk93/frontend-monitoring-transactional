export const APP_ERROR_KINDS = [
  'network',
  'timeout',
  'not_found',
  'client',
  'server',
  'cancelled',
  'unknown',
] as const

export type AppErrorKind = (typeof APP_ERROR_KINDS)[number]

export interface AppError {
  kind: AppErrorKind
  status?: number
  message: string // mensaje en español apto para el usuario
}

export const ERROR_MESSAGES: Record<AppErrorKind, string> = {
  not_found: 'La transacción no existe o no está disponible.',
  client: 'No fue posible procesar la solicitud.',
  server: 'El servicio no está disponible. Intenta más tarde.',
  network: 'No hay conexión. Revisa tu conexión a internet.',
  timeout: 'La solicitud tardó demasiado. Intenta de nuevo.',
  cancelled: 'La solicitud fue cancelada.', // no se muestra al usuario
  unknown: 'Ocurrió un error inesperado.',
}

// A6: respuesta del servicio con forma inválida
export const INVALID_RESPONSE_MESSAGE = 'La respuesta del servicio no es válida'
