import type { StatusChangeDto, TransactionDetailDto } from '../types/api.ts'
import type { Channel, TransactionStatus, TransactionType } from '../types/domain.ts'

/** Saldo de la cuenta antes de la transacción más antigua de las fixtures. */
export const OPENING_BALANCE = 20_000_000

const MINUTE_MS = 60_000

/** Base para numerar autorizaciones y comprobantes (`AUT-000001`, `CMP-000001`). */
const reference = (prefix: string, index: number): string =>
  `${prefix}-${String(index).padStart(6, '0')}`

const buildStatusHistory = (status: TransactionStatus, createdAt: Date): StatusChangeDto[] => {
  const at = (minutesAfter: number) => new Date(createdAt.getTime() + minutesAfter * MINUTE_MS).toISOString()
  const created: StatusChangeDto = { status: 'PENDING', changedAt: at(0) }

  switch (status) {
    case 'PENDING':
      return [created]
    case 'COMPLETED':
    case 'REJECTED':
      return [created, { status, changedAt: at(1) }]
    case 'RETURNED':
      return [created, { status: 'COMPLETED', changedAt: at(1) }, { status, changedAt: at(30) }]
  }
}

interface FixtureSeed {
  id: string
  type: TransactionType
  description: string
  amount: number
  status: TransactionStatus
  channel: Channel
  createdAt: Date
}

const toFixture = (seed: FixtureSeed, index: number): TransactionDetailDto => ({
  id: seed.id,
  dateTime: seed.createdAt.toISOString(),
  type: seed.type,
  description: seed.description,
  amount: seed.amount,
  currency: 'COP',
  status: seed.status,
  channel: seed.channel,
  authorizationNumber: reference('AUT', index + 1),
  receiptNumber: reference('CMP', index + 1),
  statusHistory: buildStatusHistory(seed.status, seed.createdAt),
})

// --- Transacciones de ejemplo del SPEC (DP-4) ---------------------------------------------------

const SPEC_TRANSACTIONS = [
  { id: 'TXN-001', at: '2026-07-21T09:15', type: 'DEPOSIT', description: 'Pago de nómina quincenal', amount: 10_000_000, status: 'COMPLETED', channel: 'MOBILE_APP' },
  { id: 'TXN-002', at: '2026-07-21T09:17', type: 'TRANSFER', description: 'Pago proveedor', amount: 3_500_000, status: 'COMPLETED', channel: 'WEB' },
  { id: 'TXN-003', at: '2026-07-22T08:10', type: 'WITHDRAWAL', description: 'Retiro Caja comp.', amount: 2_000_000, status: 'COMPLETED', channel: 'POINT_OF_SALE' },
  { id: 'TXN-004', at: '2026-07-22T08:12', type: 'SERVICE_PAYMENT', description: 'Pago de internet', amount: 100_000, status: 'COMPLETED', channel: 'MOBILE_APP' },
  { id: 'TXN-005', at: '2026-07-23T12:11', type: 'TRANSFER', description: 'Transferencia pago', amount: 120_000, status: 'PENDING', channel: 'WEB' },
  { id: 'TXN-006', at: '2026-07-23T13:12', type: 'DEPOSIT', description: 'Cobro factura', amount: 130_000, status: 'COMPLETED', channel: 'WEB' },
] as const satisfies readonly (Omit<FixtureSeed, 'createdAt'> & { at: string })[]

/** La transacción más reciente del SPEC se ubica 5 minutos antes de `now`. */
const LATEST_SPEC_OFFSET_MINUTES = 5

// Las horas del SPEC no tienen zona horaria: se interpretan en UTC solo para conservar la distancia
// entre transacciones al trasladarlas a la fecha actual.
const specWallClock = (at: string): number => Date.parse(`${at}:00Z`)

const buildSpecSeeds = (now: Date): FixtureSeed[] => {
  const latest = Math.max(...SPEC_TRANSACTIONS.map(({ at }) => specWallClock(at)))
  const shift = now.getTime() - LATEST_SPEC_OFFSET_MINUTES * MINUTE_MS - latest

  return SPEC_TRANSACTIONS.map(({ at, ...seed }) => ({
    ...seed,
    createdAt: new Date(specWallClock(at) + shift),
  }))
}

// --- Transacciones generadas para la paginación (DP-5, A5) --------------------------------------

const GENERATED_COUNT = 40

const GENERATED_TYPES: readonly TransactionType[] = ['DEPOSIT', 'TRANSFER', 'SERVICE_PAYMENT', 'WITHDRAWAL']

const DESCRIPTIONS: Record<TransactionType, readonly string[]> = {
  DEPOSIT: ['Cobro factura', 'Abono cliente', 'Reintegro de gastos'],
  WITHDRAWAL: ['Retiro caja', 'Retiro cajero automático'],
  TRANSFER: ['Pago proveedor', 'Transferencia a filial', 'Pago de arriendo'],
  SERVICE_PAYMENT: ['Pago de energía', 'Pago de internet', 'Pago de acueducto'],
}

const CHANNEL_BY_TYPE: Record<TransactionType, readonly Channel[]> = {
  DEPOSIT: ['WEB', 'MOBILE_APP', 'BANK_TRANSFER'],
  WITHDRAWAL: ['POINT_OF_SALE'],
  TRANSFER: ['WEB', 'BANK_TRANSFER', 'MOBILE_APP'],
  SERVICE_PAYMENT: ['MOBILE_APP', 'WEB'],
}

/** Montos mayores a $5.000.000 que quedan pendientes de autorización (RN-01). */
const HIGH_VALUE_INDEXES: readonly number[] = [15, 31]

const pick = <T>(values: readonly T[], index: number): T => values[index % values.length]

const generatedStatus = (index: number): TransactionStatus => {
  if (HIGH_VALUE_INDEXES.includes(index) || index % 9 === 4) return 'PENDING'
  if (index % 13 === 6) return 'REJECTED'
  if (index % 17 === 10) return 'RETURNED'
  return 'COMPLETED'
}

const generatedAmount = (index: number): number => {
  if (HIGH_VALUE_INDEXES.includes(index)) return 6_500_000 + index * 10_000

  const thousands = Math.round((80_000 + ((index * 7919 * 113) % 4_800_000)) / 1000) * 1000
  return index % 6 === 3 ? thousands + 0.5 : thousands // algunos montos con decimales (RN-05)
}

const buildGeneratedSeeds = (now: Date): FixtureSeed[] =>
  Array.from({ length: GENERATED_COUNT }, (_, index) => {
    const type = pick(GENERATED_TYPES, index)
    const minutesAgo = 120 + index * 2000 + ((index * 53) % 480) // ~55 días hacia atrás

    return {
      id: `TXN-${String(index + 7).padStart(3, '0')}`,
      type,
      description: pick(DESCRIPTIONS[type], index),
      amount: generatedAmount(index),
      status: generatedStatus(index),
      channel: pick(CHANNEL_BY_TYPE[type], index),
      createdAt: new Date(now.getTime() - minutesAgo * MINUTE_MS),
    }
  })

/**
 * Crea las transacciones del backend simulado relativas a `now`, ordenadas por fecha descendente.
 * Es determinista: el mismo `now` produce siempre las mismas fixtures (A5).
 */
export const createFixtures = (now: Date): TransactionDetailDto[] =>
  [...buildSpecSeeds(now), ...buildGeneratedSeeds(now)]
    .map(toFixture)
    .sort((a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime))
