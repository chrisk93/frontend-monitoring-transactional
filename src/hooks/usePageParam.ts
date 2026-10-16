import { useSearchParams } from 'react-router'

const PAGE_PARAM = 'page'
const FIRST_PAGE = 1
const POSITIVE_INTEGER = /^[1-9]\d*$/

interface SetPageOptions {
  /** Reemplaza la entrada actual del historial en lugar de agregar una nueva. */
  replace?: boolean
}

export interface UsePageParamResult {
  page: number
  setPage: (page: number, options?: SetPageOptions) => void
}

const parsePage = (value: string | null): number =>
  value !== null && POSITIVE_INTEGER.test(value) ? Number(value) : FIRST_PAGE

/**
 * Lee y escribe la página del listado en el query param `page` (DESIGN §5).
 * Un valor inválido equivale a la página 1, y la página 1 se representa sin parámetro.
 */
export const usePageParam = (): UsePageParamResult => {
  const [searchParams, setSearchParams] = useSearchParams()

  const setPage = (page: number, { replace = false }: SetPageOptions = {}) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (Number.isInteger(page) && page > FIRST_PAGE) next.set(PAGE_PARAM, String(page))
        else next.delete(PAGE_PARAM)
        return next
      },
      { replace },
    )
  }

  return { page: parsePage(searchParams.get(PAGE_PARAM)), setPage }
}
