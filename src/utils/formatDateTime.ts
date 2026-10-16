const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/**
 * Formatea una fecha ISO 8601 como `dd/mm/aaaa, hh:mm` (24 h) en la zona horaria del navegador.
 * Si la fecha no es válida, devuelve el valor original para no romper la vista.
 */
export const formatDateTime = (isoDate: string): string => {
  const date = new Date(isoDate)

  return Number.isNaN(date.getTime()) ? isoDate : dateTimeFormatter.format(date)
}
