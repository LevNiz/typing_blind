import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { registerSchema, type RegisterFormData } from '../lib/validations'
import { useAuth } from '@/features/auth/hooks/useAuth'

function RegisterPage() {
  const { register: registerUser, isRegistering, registerError } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (data: RegisterFormData) => {
    registerUser(data)
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-8 text-3xl font-bold">Регистрация</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-foreground focus:border-foreground-secondary focus:outline-none"
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-medium">
            Имя пользователя
          </label>
          <input
            id="username"
            type="text"
            {...register('username')}
            className="w-full rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-foreground focus:border-foreground-secondary focus:outline-none"
            placeholder="username"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-error">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-foreground focus:border-foreground-secondary focus:outline-none"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-error">{errors.password.message}</p>
          )}
          <p className="mt-1 text-xs text-foreground-tertiary">
            Минимум 8 символов
          </p>
        </div>

        {registerError && (
          <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
            {registerError instanceof Error
              ? registerError.message
              : 'Произошла ошибка при регистрации'}
          </div>
        )}

        <button
          type="submit"
          disabled={isRegistering}
          className="w-full rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-colors hover:bg-foreground-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegistering ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-secondary">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-foreground hover:underline">
          Войти
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
