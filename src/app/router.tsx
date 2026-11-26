import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RoomPage } from '@/pages/RoomPage'
import { AppLayout } from './layout/AppLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'room/:code', element: <RoomPage /> },
      // Dev-only screen catalog; the branch is removed from production builds.
      ...(import.meta.env.DEV
        ? [
            {
              path: 'dev/gallery',
              lazy: async () => ({ Component: (await import('@/dev/Gallery')).Gallery }),
            },
          ]
        : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
