import { PAGE_SIZE } from '../shared/constants.ts'

export interface Page<T> {
  items: T[]
  totalPages: number
  currentPage: number
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/**
 * RN-03: devuelve la página solicitada. Siempre existe al menos una página (vacía si no hay
 * elementos) y la página solicitada se ajusta al rango válido. No modifica la lista recibida.
 */
export const paginate = <T>(
  items: readonly T[],
  page: number,
  pageSize: number = PAGE_SIZE,
): Page<T> => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const requestedPage = Number.isFinite(page) ? Math.floor(page) : 1
  const currentPage = clamp(requestedPage, 1, totalPages)
  const start = (currentPage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    currentPage,
  }
}
