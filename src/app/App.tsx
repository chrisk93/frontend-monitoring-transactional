import { RouterProvider } from 'react-router/dom'
import { AppErrorBoundary } from './AppErrorBoundary.tsx'
import { AppProviders } from './AppProviders.tsx'
import { router } from './router.tsx'

function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  )
}

export default App
