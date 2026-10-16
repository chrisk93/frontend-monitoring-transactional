/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API REST. Por defecto `/api/v1`. */
  readonly VITE_API_BASE_URL?: string
  /** `'true'` activa el mock de la API con MSW (DP-14). */
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
