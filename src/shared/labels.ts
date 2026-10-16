import type {
  Channel,
  Period,
  TransactionStatus,
  TransactionType,
} from '../types/domain.ts'

// DP-7: la API usa códigos en inglés; la UI los muestra en español.

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Retiro',
  TRANSFER: 'Transferencia',
  SERVICE_PAYMENT: 'Pago de servicio',
}

export const STATUS_LABELS: Record<TransactionStatus, string> = {
  COMPLETED: 'Completada',
  PENDING: 'Pendiente',
  REJECTED: 'Rechazada',
  RETURNED: 'Devuelta',
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  MOBILE_APP: 'App Móvil',
  WEB: 'Web',
  POINT_OF_SALE: 'Punto de Venta',
  BANK_TRANSFER: 'Transferencia bancaria',
}

export const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
}
