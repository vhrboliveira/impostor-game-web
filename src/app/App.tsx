import { RouterProvider } from 'react-router-dom'
import { UpdatePrompt } from '@/pwa/UpdatePrompt'
import { router } from './router'

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <UpdatePrompt />
    </>
  )
}
