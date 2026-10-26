import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { MotionRoot } from './game/ui/MotionRoot'
import { I18nProvider } from './game/i18n/I18nProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <MotionRoot>
        <App />
      </MotionRoot>
    </I18nProvider>
  </StrictMode>
)
