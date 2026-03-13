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
