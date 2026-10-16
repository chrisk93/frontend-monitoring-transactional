import { setupServer } from 'msw/node'
import { handlers } from './handlers.ts'

/** Mock de la API para las pruebas en Node (Vitest). */
export const server = setupServer(...handlers)
