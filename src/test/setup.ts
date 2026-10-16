import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mocks/server.ts'

// Cualquier petición sin handler hace fallar la prueba en lugar de salir a la red.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Sin `globals` de Vitest, Testing Library no desmonta automáticamente lo renderizado entre pruebas.
afterEach(() => cleanup())
