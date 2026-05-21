import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '8px',
          background: '#1B1B1B',
          color: '#fff',
          fontSize: '0.9rem',
        },
        success: { iconTheme: { primary: '#2D6A4F', secondary: '#fff' } },
        error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
      }}
    />
  </StrictMode>,
)

// Dismiss splash screen once React has painted
const splash = document.getElementById('app-splash')
if (splash) {
  setTimeout(() => {
    splash.classList.add('splash-hidden')
    splash.addEventListener('transitionend', () => splash.remove(), { once: true })
  }, 2800)
}
