import { Link, useLocation } from 'react-router'
import { EmptyState } from '../../../../components/EmptyState/EmptyState.tsx'
import { TRANSACTION_TYPE_LABELS } from '../../../../shared/labels.ts'
import type { Transaction } from '../../../../types/domain.ts'
import { formatCurrency } from '../../../../utils/formatCurrency.ts'
import { formatDateTime } from '../../../../utils/formatDateTime.ts'
import type { EmptyReason } from '../../hooks/useVisibleTransactions.ts'
import { StatusBadge } from '../StatusBadge/StatusBadge.tsx'
import styles from './TransactionTable.module.scss'

interface TransactionTableProps {
  items: readonly Transaction[]
  emptyReason: EmptyReason | null
}

const EMPTY_MESSAGES: Record<EmptyReason, string> = {
  'empty-period': 'No hay transacciones en este período',
  'no-matches': 'Ninguna transacción coincide con los filtros',
}

const COLUMNS = ['ID', 'Fecha y hora', 'Tipo', 'Descripción', 'Monto', 'Moneda', 'Estado'] as const

/** RF-02: listado de transacciones. Conserva el orden recibido de la API (A3). */
export const TransactionTable = ({ items, emptyReason }: TransactionTableProps) => {
  const { search } = useLocation()

  if (emptyReason) return <EmptyState message={EMPTY_MESSAGES[emptyReason]} />

  return (
    <table className={styles['transaction-table']}>
      <thead className={styles['transaction-table__head']}>
        <tr>
          {COLUMNS.map((column) => (
            <th key={column} scope="col" className={styles['transaction-table__header']}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={styles['transaction-table__body']}>
        {items.map((transaction) => (
          <tr key={transaction.id} className={styles['transaction-table__row']}>
            <td data-label="ID" className={styles['transaction-table__cell']}>
              <Link
                to={{ pathname: `/transactions/${encodeURIComponent(transaction.id)}`, search }}
                className={styles['transaction-table__link']}
              >
                {transaction.id}
              </Link>
            </td>
            <td data-label="Fecha y hora" className={styles['transaction-table__cell']}>
              {formatDateTime(transaction.dateTime)}
            </td>
            <td data-label="Tipo" className={styles['transaction-table__cell']}>
              {TRANSACTION_TYPE_LABELS[transaction.type]}
            </td>
            <td data-label="Descripción" className={styles['transaction-table__cell']}>
              {transaction.description}
            </td>
            <td
              data-label="Monto"
              className={`${styles['transaction-table__cell']} ${styles['transaction-table__cell--amount']}`}
            >
              {formatCurrency(transaction.amount)}
              {!transaction.isAmountValid && (
                <span className={styles['transaction-table__invalid']}>Monto inválido</span>
              )}
            </td>
            <td data-label="Moneda" className={styles['transaction-table__cell']}>
              {transaction.currency}
            </td>
            <td data-label="Estado" className={styles['transaction-table__cell']}>
              <StatusBadge status={transaction.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
