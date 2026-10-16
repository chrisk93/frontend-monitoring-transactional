// Type guards genéricos para validar datos `unknown` sin recurrir a `any`.

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isString = (value: unknown): value is string => typeof value === 'string'

export const isNumber = (value: unknown): value is number => typeof value === 'number'

/** Valida que el valor pertenezca a una lista cerrada (las uniones `as const` del dominio). */
export const isOneOf =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    values.some((allowed) => allowed === value)
