import { Button } from '../Button/Button.tsx'
import styles from './ErrorState.module.scss'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className={styles['error-state']} role="alert">
    <p className={styles['error-state__message']}>{message}</p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry}>
        Reintentar
      </Button>
    )}
  </div>
)
