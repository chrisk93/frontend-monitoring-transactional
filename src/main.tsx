import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.scss'
import App from './app/App.tsx'

// DP-14: sin backend real, la API se simula con MSW antes de renderizar.
const enableMocking = async () => {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return

  const { worker } = await import('./mocks/browser.ts')
  await worker.start({ onUnhandledFrame: 'bypass' })
}

await enableMocking()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
