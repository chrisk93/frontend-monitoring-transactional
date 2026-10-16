import { CanceledError } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { ERROR_MESSAGES } from '../shared/errors.ts'
import type { AppError } from '../shared/errors.ts'
import { runCancellableRequest } from './runCancellableRequest.ts'

const serverError: AppError = { kind: 'server', status: 500, message: ERROR_MESSAGES.server }

describe('runCancellableRequest', () => {
  it('despacha FETCH_SUCCESS con el resultado de la petición', async () => {
    // Arrange
    const dispatch = vi.fn()
    const { signal } = new AbortController()

    // Act
    await runCancellableRequest(async () => ['TXN-001'], signal, dispatch)

    // Assert
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'FETCH_SUCCESS', payload: ['TXN-001'] })
  })

  it('despacha FETCH_FAILURE con el error normalizado', async () => {
    // Arrange
    const dispatch = vi.fn()
    const { signal } = new AbortController()

    // Act
    await runCancellableRequest(() => Promise.reject(new Error('fallo')), signal, dispatch)

    // Assert
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({
      type: 'FETCH_FAILURE',
      error: { kind: 'unknown', message: ERROR_MESSAGES.unknown },
    })
  })

  it('no despacha nada cuando la petición es cancelada', async () => {
    // Arrange
    const dispatch = vi.fn()
    const { signal } = new AbortController()

    // Act
    await runCancellableRequest(() => Promise.reject(new CanceledError()), signal, dispatch)

    // Assert
    expect(dispatch).not.toHaveBeenCalled()
  })

  it.each([
    ['un resultado', () => Promise.resolve(['TXN-001'])],
    ['un error', () => Promise.reject(serverError)],
  ])('no despacha %s si la señal se abortó mientras la petición estaba en curso', async (_description, request) => {
    // Arrange
    const dispatch = vi.fn()
    const controller = new AbortController()
    const slowRequest = async () => {
      controller.abort()
      return request()
    }

    // Act
    await runCancellableRequest(slowRequest, controller.signal, dispatch)

    // Assert
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('entrega la señal a la petición', async () => {
    // Arrange
    const dispatch = vi.fn()
    const { signal } = new AbortController()
    const request = vi.fn(async () => 'ok')

    // Act
    await runCancellableRequest(request, signal, dispatch)

    // Assert
    expect(request).toHaveBeenCalledWith(signal)
  })
})
