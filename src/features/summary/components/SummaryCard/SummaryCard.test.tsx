import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SummaryCard } from './SummaryCard.tsx'

describe('SummaryCard', () => {
  it('asocia la etiqueta con su valor como término y definición', () => {
    // Arrange / Act
    render(
      <dl>
        <SummaryCard label="Saldo actual" value="$5.530.000 COP" />
      </dl>,
    )

    // Assert
    expect(screen.getByRole('term')).toHaveTextContent('Saldo actual')
    expect(screen.getByRole('definition')).toHaveTextContent('$5.530.000 COP')
  })
})
