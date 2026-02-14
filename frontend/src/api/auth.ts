import apiClient, { setAccessToken } from './client'

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
}

export interface User {
  id: string
  email: string
  username: string
  is_active: boolean
  is_admin: boolean
  created_at: string
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/api/auth/register', data)
    // Сохраняем access token в памяти
    setAccessToken(response.data.access_token)
    // Refresh token автоматически сохраняется в httpOnly cookie сервером
    return response.data
  },

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/api/auth/login', data)
    // Сохраняем access token в памяти
    setAccessToken(response.data.access_token)
    // Refresh token автоматически сохраняется в httpOnly cookie сервером
    return response.data
  },

  refresh: async (): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/api/auth/refresh', {})
    setAccessToken(response.data.access_token)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout', {})
    setAccessToken(null)
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/users/me')
    return response.data
  },
}

