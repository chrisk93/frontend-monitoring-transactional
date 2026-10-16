import { useLocation, useNavigate, useParams } from 'react-router'
import { TransactionDetailModal } from '../../features/transactions/components/TransactionDetailModal/TransactionDetailModal.tsx'

export const TransactionDetailRoute = () => {
  const { transactionId = '' } = useParams()
  const { key, search } = useLocation()
  const navigate = useNavigate()

  const close = () => {
    if (key === 'default') navigate({ pathname: '/', search }, { replace: true })
    else navigate(-1)
  }

  return <TransactionDetailModal key={transactionId} transactionId={transactionId} onClose={close} />
}
