import { useId } from 'react'
import { ErrorState } from '../../../../components/ErrorState/ErrorState.tsx'
import { LoadingState } from '../../../../components/LoadingState/LoadingState.tsx'
import type { DashboardSummary, Period } from '../../../../types/domain.ts'
import { formatCurrency } from '../../../../utils/formatCurrency.ts'
import { useSummary } from '../../hooks/useSummary.ts'
import { SummaryCard } from '../SummaryCard/SummaryCard.tsx'
import styles from './SummaryPanel.module.scss'

interface SummaryPanelProps {
  period: Period
}

interface Metric {
  label: string
  value: string
}

// A1: los valores llegan calculados del backend; aquí solo se formatean (RN-05).
const toMetrics = (summary: DashboardSummary): Metric[] => [
  { label: 'Saldo actual', value: formatCurrency(summary.currentBalance) },
  { label: 'Total de transacciones', value: String(summary.transactionCount) },
  { label: 'Pendientes por aprobar', value: String(summary.pendingCount) },
  { label: 'Ingresos del período', value: formatCurrency(summary.totalIncome) },
  { label: 'Egresos del período', value: formatCurrency(summary.totalExpense) },
]

/** RF-01: panel de resumen ejecutivo del período seleccionado. */
export const SummaryPanel = ({ period }: SummaryPanelProps) => {
  const { data, status, error, retry } = useSummary(period)
  const titleId = useId()

  const renderContent = () => {
    if (status === 'failed' && error) return <ErrorState message={error.message} onRetry={retry} />
    if (!data) return <LoadingState message="Cargando resumen…" />

    return (
      <dl className={styles['summary-panel__metrics']} aria-busy={status === 'loading'}>
        {toMetrics(data).map(({ label, value }) => (
          <SummaryCard key={label} label={label} value={value} />
        ))}
      </dl>
    )
  }

  return (
    <section className={styles['summary-panel']} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles['summary-panel__title']}>
        Resumen ejecutivo
      </h2>
      {renderContent()}
    </section>
  )
}
