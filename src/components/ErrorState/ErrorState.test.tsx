import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ERROR_MESSAGES } from '../../shared/errors.ts'
import { ErrorState } from './ErrorState.tsx'

describe('ErrorState', () => {
  it('anuncia el mensaje de error con role="alert"', () => {
    // Arrange / Act
    render(<ErrorState message={ERROR_MESSAGES.server} />)

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent(ERROR_MESSAGES.server)
  })

  it('el botón Reintentar ejecuta el callback (DP-8)', async () => {
    // Arrange
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorState message={ERROR_MESSAGES.network} onRetry={onRetry} />)

    // Act
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // Assert
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('no muestra Reintentar si no recibe el callback', () => {
    // Arrange / Act
    render(<ErrorState message={ERROR_MESSAGES.not_found} />)

    // Assert
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })
})
