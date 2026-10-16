import { Button } from '../../../../components/Button/Button.tsx'
import { PERIOD_LABELS } from '../../../../shared/labels.ts'
import { PERIODS } from '../../../../types/domain.ts'
import type { Period } from '../../../../types/domain.ts'
import styles from './PeriodSelector.module.scss'

interface PeriodSelectorProps {
  value: Period
  onChange: (period: Period) => void
}

export const PeriodSelector = ({ value, onChange }: PeriodSelectorProps) => (
  <div className={styles['period-selector']} role="group" aria-label="Período">
    {PERIODS.map((period) => (
      <Button
        key={period}
        variant={period === value ? 'primary' : 'secondary'}
        aria-pressed={period === value}
        onClick={() => onChange(period)}
      >
        {PERIOD_LABELS[period]}
      </Button>
    ))}
  </div>
)
