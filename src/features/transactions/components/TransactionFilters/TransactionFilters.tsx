import { useId, useState } from 'react'
import type { ChangeEvent } from 'react'
import { STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '../../../../shared/labels.ts'
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from '../../../../types/domain.ts'
import type { TransactionFilters as Filters } from '../../../../types/domain.ts'
import { isOneOf } from '../../../../utils/typeGuards.ts'
import styles from './TransactionFilters.module.scss'

interface TransactionFiltersProps {
  onChange: (filters: Filters) => void
}

interface FilterDraft {
  from: string
  to: string
  type: string
  status: string
}

const EMPTY_DRAFT: FilterDraft = { from: '', to: '', type: '', status: '' }

export const INVALID_RANGE_MESSAGE = 'La fecha inicial no puede ser mayor que la final'

const isTransactionType = isOneOf(TRANSACTION_TYPES)
const isTransactionStatus = isOneOf(TRANSACTION_STATUSES)

// `YYYY-MM-DD` se puede comparar como texto.
const isInvalidRange = ({ from, to }: FilterDraft): boolean => from !== '' && to !== '' && from > to

/** A2: con un rango invertido se emiten los demás filtros, sin las fechas. */
const toFilters = (draft: FilterDraft): Filters => {
  const includeRange = !isInvalidRange(draft)

  return {
    ...(includeRange && draft.from ? { from: draft.from } : {}),
    ...(includeRange && draft.to ? { to: draft.to } : {}),
    ...(isTransactionType(draft.type) ? { type: draft.type } : {}),
    ...(isTransactionStatus(draft.status) ? { status: draft.status } : {}),
  }
}

/** RF-02: filtros por rango de fechas, tipo y estado (combinables con AND, RN-03). */
export const TransactionFilters = ({ onChange }: TransactionFiltersProps) => {
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_DRAFT)
  const fieldId = useId()
  const errorId = `${fieldId}-error`
  const hasInvalidRange = isInvalidRange(draft)

  const handleChange = (field: keyof FilterDraft) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const next = { ...draft, [field]: event.target.value }
    setDraft(next)
    onChange(toFilters(next))
  }

  return (
    <form
      className={styles['transaction-filters']}
      aria-label="Filtros de transacciones"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className={styles['transaction-filters__field']}>
        <label htmlFor={`${fieldId}-from`}>Desde</label>
        <input
          id={`${fieldId}-from`}
          type="date"
          value={draft.from}
          onChange={handleChange('from')}
          aria-invalid={hasInvalidRange}
          aria-describedby={hasInvalidRange ? errorId : undefined}
        />
      </div>

      <div className={styles['transaction-filters__field']}>
        <label htmlFor={`${fieldId}-to`}>Hasta</label>
        <input
          id={`${fieldId}-to`}
          type="date"
          value={draft.to}
          onChange={handleChange('to')}
          aria-invalid={hasInvalidRange}
          aria-describedby={hasInvalidRange ? errorId : undefined}
        />
      </div>

      <div className={styles['transaction-filters__field']}>
        <label htmlFor={`${fieldId}-type`}>Tipo</label>
        <select id={`${fieldId}-type`} value={draft.type} onChange={handleChange('type')}>
          <option value="">Todos</option>
          {TRANSACTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {TRANSACTION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles['transaction-filters__field']}>
        <label htmlFor={`${fieldId}-status`}>Estado</label>
        <select id={`${fieldId}-status`} value={draft.status} onChange={handleChange('status')}>
          <option value="">Todos</option>
          {TRANSACTION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {hasInvalidRange && (
        <p id={errorId} className={styles['transaction-filters__error']} role="alert">
          {INVALID_RANGE_MESSAGE}
        </p>
      )}
    </form>
  )
}
