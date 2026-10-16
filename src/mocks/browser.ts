import { setupWorker } from 'msw/browser'
import { handlers } from './handlers.ts'

/** Mock de la API en el navegador (desarrollo y build de evaluación, DP-14). */
export const worker = setupWorker(...handlers)
