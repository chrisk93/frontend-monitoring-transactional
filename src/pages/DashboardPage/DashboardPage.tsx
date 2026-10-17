import { useEffect, useId, useState } from 'react'
import { Outlet } from 'react-router'
import { ErrorState } from '../../components/ErrorState/ErrorState.tsx'
import { LoadingState } from '../../components/LoadingState/LoadingState.tsx'
import { Pagination } from '../../components/Pagination/Pagination.tsx'
import { SummaryPanel } from '../../features/summary/components/SummaryPanel/SummaryPanel.tsx'
import { TransactionFilters } from '../../features/transactions/components/TransactionFilters/TransactionFilters.tsx'
import { TransactionTable } from '../../features/transactions/components/TransactionTable/TransactionTable.tsx'
import { useTransactions } from '../../features/transactions/hooks/useTransactions.ts'
import { useVisibleTransactions } from '../../features/transactions/hooks/useVisibleTransactions.ts'
import { usePageParam } from '../../hooks/usePageParam.ts'
import type { Period, TransactionFilters as Filters } from '../../types/domain.ts'
import styles from './DashboardPage.module.scss'

const PERIOD: Period = 'monthly'

export const DashboardPage = () => {
  const [filters, setFilters] = useState<Filters>({})
  const { page, setPage } = usePageParam()
  const { data, status, error, retry } = useTransactions(PERIOD)
  const { items, currentPage, totalPages, emptyReason } = useVisibleTransactions(filters, page)
  const listTitleId = useId()

  // Una página fuera de rango se corrige en la URL sin agregar una entrada al historial.
  useEffect(() => {
    if (status === 'succeeded' && currentPage !== page) setPage(currentPage, { replace: true })
  }, [status, currentPage, page, setPage])

  const changeFilters = (nextFilters: Filters) => {
    setFilters(nextFilters)
    setPage(1)
  }

  const renderList = () => {
    if (status === 'failed' && error) return <ErrorState message={error.message} onRetry={retry} />
    if (!data) return <LoadingState message="Cargando transacciones…" />

    return (
      <div aria-busy={status === 'loading'}>
        <TransactionTable items={items} emptyReason={emptyReason} />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <SummaryPanel period={PERIOD} />

      <section className={styles['dashboard__transactions']} aria-labelledby={listTitleId}>
        <h2 id={listTitleId} className={styles['dashboard__title']}>
          Transacciones
        </h2>
        <TransactionFilters onChange={changeFilters} />
        {renderList()}
      </section>

      <Outlet />
    </div>
  )
}
