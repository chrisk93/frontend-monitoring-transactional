const LOCALE = 'es-CO'

const integerFormatter = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 0,
  useGrouping: 'always',
})

const decimalFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: 'always',
})

const roundToCents = (value: number): number => Math.round(value * 100) / 100

/**
 * RN-05: formatea un monto en COP como `$1.234.567 COP` o `$1.234.567,10 COP`.
 * Se muestran 2 decimales solo si el monto (redondeado a centavos) tiene parte decimal.
 */
export const formatCurrency = (amount: number): string => {
  const absolute = roundToCents(Math.abs(amount))
  const formatter = Number.isInteger(absolute) ? integerFormatter : decimalFormatter
  const sign = amount < 0 && absolute > 0 ? '-' : ''

  return `${sign}$${formatter.format(absolute)} COP`
}
