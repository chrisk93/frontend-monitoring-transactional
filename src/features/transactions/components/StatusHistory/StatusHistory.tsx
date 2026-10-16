import type { StatusChange } from '../../../../types/domain.ts'
import { formatDateTime } from '../../../../utils/formatDateTime.ts'
import { StatusBadge } from '../StatusBadge/StatusBadge.tsx'
import styles from './StatusHistory.module.scss'

interface StatusHistoryProps {
  history: readonly StatusChange[]
}

const byDateAscending = (a: StatusChange, b: StatusChange): number =>
  Date.parse(a.changedAt) - Date.parse(b.changedAt)

/** Audit trail de la transacción en orden cronológico (RF-03). */
export const StatusHistory = ({ history }: StatusHistoryProps) => (
  <ol className={styles['status-history']} aria-label="Historial de cambios de estado">
    {history.toSorted(byDateAscending).map(({ status, changedAt }) => (
      <li key={`${status}-${changedAt}`} className={styles['status-history__item']}>
        <StatusBadge status={status} />
        <time dateTime={changedAt} className={styles['status-history__date']}>
          {formatDateTime(changedAt)}
        </time>
      </li>
    ))}
  </ol>
)
