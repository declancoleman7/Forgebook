import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router-dom'
import './forgebook.css'
import App from './App.jsx'
import { registerInstallPromptListener } from './installPrompt.js'

registerInstallPromptListener()

// Applied before React even mounts, same as the old app's own top-of-file
// check -- otherwise anyone who's picked light mode sees a flash of dark on
// every load.
if (localStorage.getItem('forgebook.theme') === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
)
