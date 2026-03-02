import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi, User } from '@/api/auth'
import { setAccessToken } from '@/api/client'
import type { RegisterFormData, LoginFormData } from '../../../lib/validations'

export const useAuth = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Получение текущего пользователя с автоматическим refresh при ошибке
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        return await authApi.getCurrentUser()
      } catch (error) {
        // Если получили 401, пытаемся сделать refresh
        try {
          await authApi.refresh()
          // После refresh пробуем снова получить пользователя
          return await authApi.getCurrentUser()
        } catch (refreshError) {
          // Если refresh не удался, выбрасываем ошибку
          throw error
        }
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 минут
  })

  // Регистрация
  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => authApi.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      navigate('/')
    },
  })

  // Вход
  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      navigate('/')
    },
  })

  // Выход
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setAccessToken(null)
      queryClient.clear()
      navigate('/login')
    },
  })

  return {
    user,
    isLoadingUser,
    isAuthenticated: !!user,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    registerError: registerMutation.error,
    loginError: loginMutation.error,
  }
}

