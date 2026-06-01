import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import './index.css'

import { routeTree } from './routeTree.gen'
import { seedDefaultPrompts } from '@/lib/ai/default-prompts'

// Seed built-in prompts on first run (idempotent)
seedDefaultPrompts().catch(console.error)

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
