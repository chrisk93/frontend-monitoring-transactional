import type { ReactNode } from 'react'
import { TransactionsProvider } from '../features/transactions/context/TransactionsContext.tsx'

interface AppProvidersProps {
  children: ReactNode
}

export const AppProviders = ({ children }: AppProvidersProps) => (
  <TransactionsProvider>{children}</TransactionsProvider>
)
