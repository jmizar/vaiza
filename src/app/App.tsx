import { MotionConfig } from 'motion/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { router } from './router'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* "user" = follow the OS Reduce Motion setting. */}
      <MotionConfig reducedMotion="user">
        <div className="app-column">
          <RouterProvider router={router} />
        </div>
      </MotionConfig>
    </QueryClientProvider>
  )
}
