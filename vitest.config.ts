import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

const MIN_COVERAGE = { statements: 80, branches: 80, functions: 80, lines: 80 }

// https://vitest.dev/config/
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
        // DP-9: umbral mínimo solo para la lógica de negocio, utilidades y servicios
        thresholds: {
          'src/features/**/domain/**': MIN_COVERAGE,
          'src/utils/**': MIN_COVERAGE,
          'src/services/**': MIN_COVERAGE,
        },
      },
    },
  }),
)
