import { describe, expect, it } from 'vitest'
import { INVALID_RESPONSE_MESSAGE } from '../shared/errors.ts'
import type {
  SummaryResponseDto,
  TransactionDetailResponseDto,
  TransactionDto,
  TransactionListResponseDto,
} from '../types/api.ts'
import { mapSummary, mapTransactionDetail, mapTransactionList } from './mappers.ts'

const INVALID_RESPONSE = { kind: 'unknown', message: INVALID_RESPONSE_MESSAGE }

const transactionDto: TransactionDto = {
  id: 'TXN-001',
  dateTime: '2026-07-21T09:15:00-05:00',
  type: 'DEPOSIT',
  description: 'Pago de nómina quincenal',
  amount: 10_000_000,
  currency: 'COP',
  status: 'COMPLETED',
}

const summaryDto: SummaryResponseDto = {
  period: 'monthly',
  previousBalance: 1_000_000,
  currentBalance: 5_530_000,
  transactionCount: 6,
  pendingCount: 1,
  totalIncome: 10_130_000,
  totalExpense: 5_600_000,
}

const listDto: TransactionListResponseDto = {
  previousBalance: 1_000_000,
  items: [transactionDto],
}

const detailDto: TransactionDetailResponseDto = {
  previousBalance: 1_000_000,
  transaction: {
    ...transactionDto,
    channel: 'MOBILE_APP',
    authorizationNumber: 'AUT-000001',
    receiptNumber: 'CMP-000001',
    statusHistory: [
      { status: 'PENDING', changedAt: '2026-07-21T09:15:00-05:00' },
      { status: 'COMPLETED', changedAt: '2026-07-21T09:16:00-05:00' },
    ],
  },
}

// Construye una variante inválida de un DTO sin tipar: simula una respuesta mal formada de la API.
const withField = (dto: object, field: string, value: unknown): unknown => ({ ...dto, [field]: value })
const withoutField = (dto: object, field: string): unknown =>
  Object.fromEntries(Object.entries(dto).filter(([key]) => key !== field))

describe('mapSummary', () => {
  it('mapea un resumen válido, incluido el saldo actual (A1)', () => {
    // Arrange
    const data: unknown = summaryDto

    // Act
    const result = mapSummary(data)

    // Assert
    expect(result).toEqual(summaryDto)
  })

  it('rechaza un resumen sin currentBalance (A6)', () => {
    // Arrange
    const data = withoutField(summaryDto, 'currentBalance')

    // Act
    const act = () => mapSummary(data)

    // Assert
    expect(act).toThrow(expect.objectContaining(INVALID_RESPONSE))
  })

  it.each([
    ['un período fuera de la unión', 'period', 'yearly'],
    ['un total como texto', 'totalIncome', '10130000'],
  ])('rechaza un resumen con %s (A6)', (_description, field, value) => {
    // Arrange
    const data = withField(summaryDto, field, value)

    // Act
    const act = () => mapSummary(data)

    // Assert
    expect(act).toThrow(expect.objectContaining(INVALID_RESPONSE))
  })

  it.each([
    ['null', null],
    ['un arreglo', []],
    ['un texto', 'ok'],
  ])('rechaza una respuesta que es %s (A6)', (_description, data) => {
    // Arrange: respuesta definida en la tabla

    // Act
    const act = () => mapSummary(data)

    // Assert
    expect(act).toThrow(expect.objectContaining(INVALID_RESPONSE))
  })
})

describe('mapTransactionList', () => {
  it('mapea un listado válido y calcula isAmountValid', () => {
    // Arrange
    const data: unknown = listDto

    // Act
    const result = mapTransactionList(data)

    // Assert
    expect(result).toEqual({
      previousBalance: 1_000_000,
      items: [{ ...transactionDto, isAmountValid: true }],
    })
  })

  it('conserva el orden recibido de la API (A3)', () => {
    // Arrange
    const data: unknown = {
      previousBalance: 0,
      items: [
        { ...transactionDto, id: 'TXN-003' },
        { ...transactionDto, id: 'TXN-001' },
        { ...transactionDto, id: 'TXN-002' },
      ],
    }

    // Act
    const result = mapTransactionList(data)

    // Assert
    expect(result.items.map(({ id }) => id)).toEqual(['TXN-003', 'TXN-001', 'TXN-002'])
  })

  it.each([
    ['negativo', -1],
    ['mayor al máximo', 10_000_000.01],
  ])('marca como inválido un monto %s (DP-6)', (_description, amount) => {
    // Arrange
    const data: unknown = { ...listDto, items: [{ ...transactionDto, amount }] }

    // Act
    const result = mapTransactionList(data)

    // Assert
    expect(result.items[0].isAmountValid).toBe(false)
  })

  it('descarta campos que no pertenecen al modelo de dominio', () => {
    // Arrange
    const data: unknown = { ...listDto, items: [{ ...transactionDto, internalNote: 'x' }] }

    // Act
    const result = mapTransactionList(data)

    // Assert
    expect(result.items[0]).not.toHaveProperty('internalNote')
  })

  it('rechaza un listado cuyo items no es un arreglo (A6)', () => {
    // Arrange
    const data = withField(listDto, 'items', { 0: transactionDto })

    // Act
    const act = () => mapTransactionList(data)

    // Assert
    expect(act).toThrow(expect.objectContaining(INVALID_RESPONSE))
  })

  it.each([
    ['sin id', withoutField(transactionDto, 'id')],
    ['con un tipo fuera de la unión', withField(transactionDto, 'type', 'LOAN')],
    ['con un estado fuera de la unión', withField(transactionDto, 'status', 'APPROVED')],
    ['con una moneda no soportada', withField(transactionDto, 'currency', 'USD')],
    ['con un monto como texto', withField(transactionDto, 'amount', '1000')],
    ['con una fecha inválida', withField(transactionDto, 'dateTime', 'ayer')],
  ])('rechaza un listado con una transacción %s (A6)', (_description, transaction) => {
    // Arrange
    const data: unknown = { ...listDto, items: [transaction] }

    // Act
    const act = () => mapTransactionList(data)

    // Assert
    expect(act).toThrow(expect.objectContaining(INVALID_RESPONSE))
  })

  it('rechaza un listado sin saldo anterior (A6)', () => {
    // Arrange
    const data = withoutField(listDto, 'previousBalance')

    // Act
    const act = () => mapTransactionList(data)

    // Assert
    expect(act).toThrow(expect.objectContaining(INVALID_RESPONSE))
  })
})

describe('mapTransactionDetail', () => {
  it('mapea un detalle válido con canal, referencias e historial', () => {
    // Arrange
    const data: unknown = detailDto

    // Act
    const result = mapTransactionDetail(data)

    // Assert
    expect(result).toEqual({ ...detailDto.transaction, isAmountValid: true })
  })

  it.each([
    ['un canal fuera de la unión', withField(detailDto.transaction, 'channel', 'ATM')],
    ['un historial que no es un arreglo', withField(detailDto.transaction, 'statusHistory', null)],
    [
      'un cambio de estado inválido',
      withField(detailDto.transaction, 'statusHistory', [{ status: 'DONE', changedAt: 'x' }]),
    ],
    ['sin número de autorización', withoutField(detailDto.transaction, 'authorizationNumber')],
  ])('rechaza un detalle con %s (A6)', (_description, transaction) => {
    // Arrange
    const data: unknown = { ...detailDto, transaction }

    // Act
    const act = () => mapTransactionDetail(data)

    // Assert
    expect(act).toThrow(expect.objectContaining(INVALID_RESPONSE))
  })

  it('rechaza un detalle sin la transacción (A6)', () => {
    // Arrange
    const data = withoutField(detailDto, 'transaction')

    // Act
    const act = () => mapTransactionDetail(data)

    // Assert
    expect(act).toThrow(expect.objectContaining(INVALID_RESPONSE))
  })
})
