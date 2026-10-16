import { useId } from 'react'
import type { ReactNode } from 'react'
import { ErrorState } from '../../../../components/ErrorState/ErrorState.tsx'
import { LoadingState } from '../../../../components/LoadingState/LoadingState.tsx'
import { Modal } from '../../../../components/Modal/Modal.tsx'
import { CHANNEL_LABELS, TRANSACTION_TYPE_LABELS } from '../../../../shared/labels.ts'
import type { TransactionDetail } from '../../../../types/domain.ts'
import { formatCurrency } from '../../../../utils/formatCurrency.ts'
import { formatDateTime } from '../../../../utils/formatDateTime.ts'
import { useTransactionDetail } from '../../hooks/useTransactionDetail.ts'
import { StatusBadge } from '../StatusBadge/StatusBadge.tsx'
import { StatusHistory } from '../StatusHistory/StatusHistory.tsx'
import styles from './TransactionDetailModal.module.scss'

interface TransactionDetailModalProps {
  transactionId: string
  onClose: () => void
}

interface DetailField {
  label: string
  value: ReactNode
}

const toFields = (detail: TransactionDetail): DetailField[] => [
  { label: 'ID', value: detail.id },
  { label: 'Fecha y hora', value: formatDateTime(detail.dateTime) },
  { label: 'Tipo', value: TRANSACTION_TYPE_LABELS[detail.type] },
  { label: 'Descripción', value: detail.description },
  {
    label: 'Monto',
    value: (
      <>
        {formatCurrency(detail.amount)}
        {!detail.isAmountValid && (
          <span className={styles['transaction-detail__invalid']}>Monto inválido</span>
        )}
      </>
    ),
  },
  { label: 'Moneda', value: detail.currency },
  { label: 'Estado', value: <StatusBadge status={detail.status} /> },
  { label: 'Canal', value: CHANNEL_LABELS[detail.channel] },
  { label: 'Número de autorización', value: detail.authorizationNumber },
  { label: 'Comprobante', value: detail.receiptNumber },
]

export const TransactionDetailModal = ({ transactionId, onClose }: TransactionDetailModalProps) => {
  const { data, status, error, retry } = useTransactionDetail(transactionId)
  const historyTitleId = useId()

  const renderContent = () => {
    if (status === 'failed' && error) {
      // Reintentar no tiene sentido si la transacción no existe.
      const canRetry = error.kind !== 'not_found'
      return <ErrorState message={error.message} onRetry={canRetry ? retry : undefined} />
    }
    if (!data || status === 'loading') return <LoadingState message="Cargando detalle…" />

    return (
      <div className={styles['transaction-detail']}>
        <dl className={styles['transaction-detail__fields']}>
          {toFields(data).map(({ label, value }) => (
            <div key={label} className={styles['transaction-detail__field']}>
              <dt className={styles['transaction-detail__label']}>{label}</dt>
              <dd className={styles['transaction-detail__value']}>{value}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby={historyTitleId}>
          <h3 id={historyTitleId} className={styles['transaction-detail__subtitle']}>
            Historial de estados
          </h3>
          <StatusHistory history={data.statusHistory} />
        </section>
      </div>
    )
  }

  return (
    <Modal title="Detalle de la transacción" onClose={onClose}>
      {renderContent()}
    </Modal>
  )
}
