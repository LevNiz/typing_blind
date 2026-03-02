import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Введите email').email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

export const registerSchema = z.object({
  email: z.string().min(1, 'Введите email').email('Некорректный email'),
  username: z
    .string()
    .min(2, 'Имя пользователя не менее 2 символов')
    .max(50, 'Имя пользователя не более 50 символов'),
  password: z
    .string()
    .min(6, 'Пароль не менее 6 символов')
    .max(128, 'Пароль не более 128 символов'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
