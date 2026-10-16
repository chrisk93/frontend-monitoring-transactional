import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal.tsx'

const renderModal = (onClose = vi.fn()) => {
  render(
    <Modal title="Detalle de transacción" onClose={onClose}>
      <p>Contenido del detalle</p>
    </Modal>,
  )
  return { onClose, user: userEvent.setup() }
}

/** Botón que abre el modal y lo cierra con su `onClose`, para probar el retorno del foco. */
const ModalTrigger = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Ver detalle
      </button>
      {isOpen && (
        <Modal title="Detalle" onClose={() => setIsOpen(false)}>
          <p>Contenido</p>
        </Modal>
      )}
    </>
  )
}

describe('Modal', () => {
  it('se presenta como diálogo modal con el título como nombre accesible', () => {
    // Arrange / Act
    renderModal()

    // Assert
    const dialog = screen.getByRole('dialog', { name: 'Detalle de transacción' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveTextContent('Contenido del detalle')
  })

  it('se renderiza en un portal sobre document.body', () => {
    // Arrange / Act
    renderModal()

    // Assert
    expect(screen.getByRole('dialog').closest('body > div')).toBe(screen.getByTestId('modal-backdrop'))
  })

  it('mueve el foco al diálogo al abrirse', () => {
    // Arrange / Act
    renderModal()

    // Assert
    expect(screen.getByRole('dialog')).toHaveFocus()
  })

  it('se cierra con la tecla Escape', async () => {
    // Arrange
    const { onClose, user } = renderModal()

    // Act
    await user.keyboard('{Escape}')

    // Assert
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('se cierra con clic en el fondo', async () => {
    // Arrange
    const { onClose, user } = renderModal()

    // Act
    await user.click(screen.getByTestId('modal-backdrop'))

    // Assert
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('no se cierra con clic dentro del diálogo', async () => {
    // Arrange
    const { onClose, user } = renderModal()

    // Act
    await user.click(screen.getByText('Contenido del detalle'))

    // Assert
    expect(onClose).not.toHaveBeenCalled()
  })

  it('se cierra con el botón Cerrar', async () => {
    // Arrange
    const { onClose, user } = renderModal()

    // Act
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    // Assert
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('al cerrarse devuelve el foco al elemento que lo abrió', async () => {
    // Arrange
    const user = userEvent.setup()
    render(<ModalTrigger />)
    const trigger = screen.getByRole('button', { name: 'Ver detalle' })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toHaveFocus()

    // Act
    await user.keyboard('{Escape}')

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
