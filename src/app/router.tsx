import { createBrowserRouter } from 'react-router'
import { Foundations } from '@/features/dev/Foundations'

// Screens are added per milestone (see docs/spec.md). Until M1 the app shows the
// Foundations page: tokens, type and motion presets rendered from code.
export const router = createBrowserRouter([
  { path: '/', element: <Foundations /> },
  { path: '/dev/foundations', element: <Foundations /> },
])
