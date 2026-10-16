import { AxiosError } from 'axios'
import type { AxiosAdapter } from 'axios'
import { describe, expect, it } from 'vitest'
import { ERROR_MESSAGES } from '../../shared/errors.ts'
import { DEFAULT_API_BASE_URL, REQUEST_TIMEOUT_MS, httpClient } from './httpClient.ts'

// El adapter reemplaza la capa de red para probar la configuración y el interceptor sin servidor.

describe('httpClient', () => {
  it('usa la URL base por defecto y un timeout de 10 s', () => {
    // Arrange / Act
    const { baseURL, timeout } = httpClient.defaults

    // Assert
    expect(baseURL).toBe(DEFAULT_API_BASE_URL)
    expect(timeout).toBe(REQUEST_TIMEOUT_MS)
    expect(REQUEST_TIMEOUT_MS).toBe(10_000)
  })

  it('devuelve la respuesta sin cambios cuando la petición es exitosa', async () => {
    // Arrange
    const adapter: AxiosAdapter = async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })

    // Act
    const response = await httpClient.get('/dashboard/summary', { adapter })

    // Assert
    expect(response.data).toEqual({ ok: true })
  })

  it('rechaza con un AppError cuando la petición falla', async () => {
    // Arrange
    const adapter: AxiosAdapter = async (config) => {
      throw new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, {}, {
        data: null,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config,
      })
    }

    // Act
    const request = httpClient.get('/dashboard/summary', { adapter })

    // Assert
    await expect(request).rejects.toEqual({
      kind: 'server',
      status: 500,
      message: ERROR_MESSAGES.server,
    })
  })
})
