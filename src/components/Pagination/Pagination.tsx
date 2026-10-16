import { Button } from '../Button/Button.tsx'
import styles from './Pagination.module.scss'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

/** A4: con una sola página no se muestra. */
export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav className={styles.pagination} aria-label="Paginación">
      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Anterior
      </Button>

      <ol className={styles['pagination__pages']}>
        {pages.map((page) => (
          <li key={page}>
            <Button
              variant={page === currentPage ? 'primary' : 'secondary'}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              aria-label={`Página ${page}`}
            >
              {page}
            </Button>
          </li>
        ))}
      </ol>

      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Siguiente
      </Button>
    </nav>
  )
}
