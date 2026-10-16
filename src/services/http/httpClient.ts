import axios from 'axios'
import { normalizeError } from './normalizeError.ts'

export const DEFAULT_API_BASE_URL = '/api/v1'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
export const REQUEST_TIMEOUT_MS = 10_000

/** Única instancia de Axios de la aplicación (DESIGN §6). */
export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
})

// Todo fallo llega a las capas superiores como `AppError`.
httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeError(error)),
)
