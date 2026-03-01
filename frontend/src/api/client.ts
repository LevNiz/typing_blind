import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// В production используем относительный путь (через nginx proxy)
// Nginx проксирует /api/* на backend, поэтому baseURL должен быть пустым
// В development используем прямой URL или из переменной окружения
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000')

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: для отправки httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Store access token in memory (not in localStorage/cookies for security)
let accessToken: string | null = null

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

export const getAccessToken = () => accessToken

// Request interceptor: добавляем access token в заголовки
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: обрабатываем 401 и делаем refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Если получили 401 и это не запрос на refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Если уже идёт refresh, добавляем запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Пытаемся обновить access token через refresh endpoint
        // Используем тот же baseURL что и в apiClient
        const refreshUrl = API_URL ? `${API_URL}/api/auth/refresh` : '/api/auth/refresh'
        const response = await axios.post(
          refreshUrl,
          {},
          {
            withCredentials: true, // Отправляем httpOnly cookie с refresh token
          }
        )

        const { access_token } = response.data
        setAccessToken(access_token)

        processQueue(null, access_token)

        // Повторяем оригинальный запрос с новым токеном
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh не удался - пользователь должен залогиниться заново
        processQueue(refreshError as AxiosError, null)
        setAccessToken(null)
        // Можно перенаправить на страницу логина
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient

