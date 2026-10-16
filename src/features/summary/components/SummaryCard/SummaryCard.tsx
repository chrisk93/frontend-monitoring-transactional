import styles from './SummaryCard.module.scss'

interface SummaryCardProps {
  label: string
  value: string
}

/** Métrica del resumen. Se usa dentro de una lista de descripción (`<dl>`). */
export const SummaryCard = ({ label, value }: SummaryCardProps) => (
  <div className={styles['summary-card']}>
    <dt className={styles['summary-card__label']}>{label}</dt>
    <dd className={styles['summary-card__value']}>{value}</dd>
  </div>
)
