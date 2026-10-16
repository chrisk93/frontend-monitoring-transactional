import styles from './LoadingState.module.scss'

interface LoadingStateProps {
  message?: string
}

export const LoadingState = ({ message = 'Cargando…' }: LoadingStateProps) => (
  <div className={styles['loading-state']} role="status" aria-busy="true">
    <span className={styles['loading-state__spinner']} aria-hidden="true" />
    <span>{message}</span>
  </div>
)
