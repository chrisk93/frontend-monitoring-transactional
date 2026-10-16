import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Transaction } from '../../../../types/domain.ts'
import type { EmptyReason } from '../../hooks/useVisibleTransactions.ts'
import { TransactionTable } from './TransactionTable.tsx'

const buildTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'TXN-001',
  dateTime: '2026-07-21T09:15:00-05:00',
  type: 'DEPOSIT',
  description: 'Pago de nómina quincenal',
  amount: 10_000_000,
  currency: 'COP',
  status: 'COMPLETED',
  isAmountValid: true,
  ...overrides,
})

const renderTable = (
  items: readonly Transaction[],
  { emptyReason = null, url = '/' }: { emptyReason?: EmptyReason | null; url?: string } = {},
) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <TransactionTable items={items} emptyReason={emptyReason} />
    </MemoryRouter>,
  )

const bodyRows = () => screen.getAllByRole('row').slice(1)

describe('TransactionTable (RF-02)', () => {
  it('muestra las 7 columnas del SPEC', () => {
    // Arrange / Act
    renderTable([buildTransaction({})])

    // Assert
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'ID',
      'Fecha y hora',
      'Tipo',
      'Descripción',
      'Monto',
      'Moneda',
      'Estado',
    ])
  })

  it('muestra los datos de la fila con etiquetas en español y formatos de fecha y moneda', () => {
    // Arrange
    const transaction = buildTransaction({
      id: 'TXN-005',
      dateTime: '2026-07-23T12:11:00-05:00',
      type: 'TRANSFER',
      description: 'Transferencia pago',
      amount: 120_000.5,
      status: 'PENDING',
    })

    // Act
    renderTable([transaction])

    // Assert
    const cells = within(bodyRows()[0]).getAllByRole('cell').map((cell) => cell.textContent)
    expect(cells).toEqual([
      'TXN-005',
      '23/07/2026, 12:11',
      'Transferencia',
      'Transferencia pago',
      '$120.000,50 COP',
      'COP',
      'Pendiente',
    ])
  })

  it('conserva el orden en que recibe las transacciones (A3)', () => {
    // Arrange
    const items = ['TXN-003', 'TXN-001', 'TXN-002'].map((id) => buildTransaction({ id }))

    // Act
    renderTable(items)

    // Assert
    expect(bodyRows().map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      'TXN-003',
      'TXN-001',
      'TXN-002',
    ])
  })

  it('enlaza cada fila con su detalle conservando la página actual', () => {
    // Arrange / Act
    renderTable([buildTransaction({ id: 'TXN-006' })], { url: '/?page=2' })

    // Assert
    expect(screen.getByRole('link', { name: 'TXN-006' })).toHaveAttribute('href', '/transactions/TXN-006?page=2')
  })

  it('codifica el id en el enlace al detalle', () => {
    // Arrange / Act
    renderTable([buildTransaction({ id: 'TXN 1/2' })])

    // Assert
    expect(screen.getByRole('link', { name: 'TXN 1/2' })).toHaveAttribute('href', '/transactions/TXN%201%2F2')
  })

  it('marca las transacciones con monto inválido (DP-6)', () => {
    // Arrange
    const items = [
      buildTransaction({ id: 'TXN-VALID' }),
      buildTransaction({ id: 'TXN-INVALID', amount: -500, isAmountValid: false }),
    ]

    // Act
    renderTable(items)

    // Assert
    const [validRow, invalidRow] = bodyRows()
    expect(within(validRow).queryByText('Monto inválido')).not.toBeInTheDocument()
    expect(within(invalidRow).getByText('Monto inválido')).toBeInTheDocument()
    expect(within(invalidRow).getByText(/-\$500 COP/)).toBeInTheDocument()
  })

  it.each([
    ['empty-period', 'No hay transacciones en este período'],
    ['no-matches', 'Ninguna transacción coincide con los filtros'],
  ] as const)('con emptyReason=%s muestra "%s" en lugar de la tabla', (emptyReason, message) => {
    // Arrange / Act
    renderTable([], { emptyReason })

    // Assert
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
