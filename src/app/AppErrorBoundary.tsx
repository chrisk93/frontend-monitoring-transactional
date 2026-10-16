import { Component } from 'react'
import type { ReactNode } from 'react'
import { ErrorState } from '../components/ErrorState/ErrorState.tsx'

export const UNEXPECTED_ERROR_MESSAGE = 'Ocurrió un error inesperado. Recarga la página para continuar.'

export const UnexpectedError = () => <ErrorState message={UNEXPECTED_ERROR_MESSAGE} />

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

/** Captura errores de render fuera de las rutas para no dejar la aplicación en blanco. */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    return this.state.hasError ? <UnexpectedError /> : this.props.children
  }
}
