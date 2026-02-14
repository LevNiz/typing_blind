import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type AdminUserResponse, type AdminUserUpdate } from '@/api/admin'

interface UserEditModalProps {
  user: AdminUserResponse
  onClose: () => void
}

function UserEditModal({ user, onClose }: UserEditModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<AdminUserUpdate>({
    email: user.email,
    username: user.username,
    is_active: user.is_active,
    is_admin: user.is_admin,
  })

  const updateMutation = useMutation({
    mutationFn: (data: AdminUserUpdate) => adminApi.updateUser(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-foreground-secondary/20 bg-background p-6">
        <h2 className="mb-4 text-xl font-semibold">Редактировать пользователя</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-foreground focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary">
              Имя пользователя
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-foreground focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active ?? false}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-foreground-secondary/20 text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground-secondary">Активен</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_admin ?? false}
                onChange={(e) =>
                  setFormData({ ...formData, is_admin: e.target.checked })
                }
                className="h-4 w-4 rounded border-foreground-secondary/20 text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground-secondary">Админ</span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-sm hover:bg-background-secondary/80"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserEditModal

