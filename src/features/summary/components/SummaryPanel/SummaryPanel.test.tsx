import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../../mocks/server.ts'
import { ERROR_MESSAGES } from '../../../../shared/errors.ts'
import type { SummaryResponseDto } from '../../../../types/api.ts'
import { SummaryPanel } from './SummaryPanel.tsx'

const SUMMARY_URL = '/api/v1/dashboard/summary'

// El saldo actual no coincide a propósito con saldo anterior + ingresos - egresos: el panel debe
// mostrar el valor recibido sin recalcularlo (A1).
const summary: SummaryResponseDto = {
  period: 'monthly',
  previousBalance: 1_000_000,
  currentBalance: 7_777_777.5,
  transactionCount: 46,
  pendingCount: 3,
  totalIncome: 10_130_000,
  totalExpense: 5_600_000,
}

const respondWith = (body: SummaryResponseDto) =>
  server.use(http.get(SUMMARY_URL, () => HttpResponse.json(body)))

/** Devuelve el valor (`<dd>`) asociado a la etiqueta (`<dt>`) de una métrica. */
const metricValue = (label: string) => screen.getByText(label).nextElementSibling?.textContent

describe('SummaryPanel (RF-01)', () => {
  it('muestra un indicador de carga mientras llega el resumen', () => {
    // Arrange
    respondWith(summary)

    // Act
    render(<SummaryPanel period="monthly" />)

    // Assert
    expect(screen.getByRole('status')).toHaveTextContent('Cargando resumen…')
  })

  it('muestra las 5 métricas con los valores recibidos, formateados y sin recalcular', async () => {
    // Arrange
    respondWith(summary)

    // Act
    render(<SummaryPanel period="monthly" />)

    // Assert
    expect(await screen.findByText('Saldo actual')).toBeInTheDocument()
    expect(metricValue('Saldo actual')).toBe('$7.777.777,50 COP')
    expect(metricValue('Total de transacciones')).toBe('46')
    expect(metricValue('Pendientes por aprobar')).toBe('3')
    expect(metricValue('Ingresos del período')).toBe('$10.130.000 COP')
    expect(metricValue('Egresos del período')).toBe('$5.600.000 COP')
  })

  it('muestra métricas en 0 como datos válidos cuando el período no tiene movimientos', async () => {
    // Arrange
    respondWith({
      ...summary,
      period: 'daily',
      currentBalance: 0,
      transactionCount: 0,
      pendingCount: 0,
      totalIncome: 0,
      totalExpense: 0,
    })

    // Act
    render(<SummaryPanel period="daily" />)

    // Assert
    expect(await screen.findByText('Saldo actual')).toBeInTheDocument()
    expect(metricValue('Saldo actual')).toBe('$0 COP')
    expect(metricValue('Total de transacciones')).toBe('0')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muestra el error y permite reintentar hasta recuperar los datos', async () => {
    // Arrange: la primera petición falla y la segunda responde bien
    let calls = 0
    server.use(
      http.get(SUMMARY_URL, () => {
        calls += 1
        return calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(summary)
      }),
    )
    const user = userEvent.setup()
    render(<SummaryPanel period="monthly" />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(ERROR_MESSAGES.server)

    // Act
    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    // Assert
    expect(await screen.findByText('Saldo actual')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('pide el resumen del período recibido', async () => {
    // Arrange
    let requestedPeriod: string | null = null
    server.use(
      http.get(SUMMARY_URL, ({ request }) => {
        requestedPeriod = new URL(request.url).searchParams.get('period')
        return HttpResponse.json({ ...summary, period: 'weekly' })
      }),
    )

    // Act
    render(<SummaryPanel period="weekly" />)

    // Assert
    expect(await screen.findByText('Saldo actual')).toBeInTheDocument()
    expect(requestedPeriod).toBe('weekly')
  })

  it('se presenta como una sección con título', async () => {
    // Arrange
    respondWith(summary)

    // Act
    render(<SummaryPanel period="monthly" />)

    // Assert
    expect(screen.getByRole('region', { name: 'Resumen ejecutivo' })).toBeInTheDocument()
    expect(await screen.findAllByRole('term')).toHaveLength(5)
  })
})
