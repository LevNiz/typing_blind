import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './app/App'
import { authApi } from './api/auth'
import { setAccessToken } from './api/client'
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// При загрузке приложения пытаемся обновить access token через refresh
// Это нужно, чтобы сохранить сессию при обновлении страницы
const initializeAuth = async () => {
  try {
    const response = await authApi.refresh()
    setAccessToken(response.access_token)
  } catch (error) {
    // Если refresh не удался, пользователь должен залогиниться заново
    // Это нормально, если refresh token истёк или его нет
    console.log('No valid session found')
  }
}

// Инициализируем auth перед рендером
initializeAuth().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  )
})

