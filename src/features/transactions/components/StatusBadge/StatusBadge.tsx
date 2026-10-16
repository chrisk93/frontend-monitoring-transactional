import { STATUS_LABELS } from '../../../../shared/labels.ts'
import type { TransactionStatus } from '../../../../types/domain.ts'
import styles from './StatusBadge.module.scss'

interface StatusBadgeProps {
  status: TransactionStatus
}

/** El estado se comunica con texto además de color (accesibilidad). */
export const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span className={`${styles.badge} ${styles[`badge--${status.toLowerCase()}`]}`}>
    {STATUS_LABELS[status]}
  </span>
)
