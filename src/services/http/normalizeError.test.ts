import { AxiosError, AxiosHeaders, CanceledError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { ERROR_MESSAGES } from '../../shared/errors.ts'
import type { AppError } from '../../shared/errors.ts'
import { isAppError, normalizeError } from './normalizeError.ts'

const config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() }

const httpError = (status: number): AxiosError =>
  new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, {}, {
    status,
    statusText: '',
    data: null,
    headers: {},
    config,
  })

describe('normalizeError', () => {
  it.each([
    [404, 'not_found'],
    [400, 'client'],
    [422, 'client'],
    [500, 'server'],
    [503, 'server'],
  ] as const)('convierte HTTP %i en %s con su mensaje y estado', (status, kind) => {
    // Arrange
    const error = httpError(status)

    // Act
    const result = normalizeError(error)

    // Assert
    expect(result).toEqual({ kind, status, message: ERROR_MESSAGES[kind] })
  })

  it('convierte un estado HTTP no clasificado en unknown', () => {
    // Arrange
    const error = httpError(302)

    // Act
    const result = normalizeError(error)

    // Assert
    expect(result).toEqual({ kind: 'unknown', status: 302, message: ERROR_MESSAGES.unknown })
  })

  it('convierte un error sin respuesta en network', () => {
    // Arrange
    const error = new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {})

    // Act
    const result = normalizeError(error)

    // Assert
    expect(result).toEqual({ kind: 'network', message: ERROR_MESSAGES.network })
  })

  it.each([AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT])(
    'convierte el código %s en timeout',
    (code) => {
      // Arrange
      const error = new AxiosError('timeout of 10000ms exceeded', code, config, {})

      // Act
      const result = normalizeError(error)

      // Assert
      expect(result).toEqual({ kind: 'timeout', message: ERROR_MESSAGES.timeout })
    },
  )

  it('convierte una petición cancelada en cancelled', () => {
    // Arrange
    const error = new CanceledError(undefined, config)

    // Act
    const result = normalizeError(error)

    // Assert
    expect(result).toEqual({ kind: 'cancelled', message: ERROR_MESSAGES.cancelled })
  })

  it.each([
    ['un Error nativo', new Error('fallo inesperado')],
    ['un texto', 'fallo'],
    ['undefined', undefined],
  ])('convierte %s en unknown', (_description, error) => {
    // Arrange: error definido en la tabla

    // Act
    const result = normalizeError(error)

    // Assert
    expect(result).toEqual({ kind: 'unknown', message: ERROR_MESSAGES.unknown })
  })

  it('devuelve sin cambios un AppError ya normalizado', () => {
    // Arrange
    const error: AppError = { kind: 'unknown', message: 'La respuesta del servicio no es válida' }

    // Act
    const result = normalizeError(error)

    // Assert
    expect(result).toBe(error)
  })
})

describe('isAppError', () => {
  it.each([
    ['un AppError', { kind: 'server', message: 'x' }, true],
    ['un objeto con un kind desconocido', { kind: 'otro', message: 'x' }, false],
    ['un objeto sin mensaje', { kind: 'server' }, false],
    ['null', null, false],
  ])('identifica %s', (_description, value, expected) => {
    // Arrange: valor definido en la tabla

    // Act
    const result = isAppError(value)

    // Assert
    expect(result).toBe(expected)
  })
})
