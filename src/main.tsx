import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import { App } from '@/app/App'
import { useApp } from '@/store/app'

// Embedded build (artifact / preview frame): the host already pads the page for the phone's safe areas.
if (import.meta.env.VITE_EMBED) document.documentElement.dataset.embed = 'true'

// Prototype links: ?demo=1 loads the demo trips, ?reset=1 starts as a first launch.
const params = new URLSearchParams(window.location.search)
if (params.has('reset')) useApp.getState().reset()
if (params.has('demo')) useApp.getState().loadDemo()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
