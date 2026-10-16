import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AppProviders } from '../app/AppProviders.tsx'
import { routes } from '../app/routes.tsx'

export const renderWithProviders = (initialUrl = '/') => {
  const router = createMemoryRouter(routes, { initialEntries: [initialUrl] })
  const view = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return { ...view, router, user: userEvent.setup() }
}
