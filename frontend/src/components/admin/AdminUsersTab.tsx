import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type AdminUserResponse } from '@/api/admin'
import UserEditModal from './UserEditModal'
import UserStatsModal from './UserStatsModal'

function AdminUsersTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editingUser, setEditingUser] = useState<AdminUserResponse | null>(null)
  const [statsUser, setStatsUser] = useState<AdminUserResponse | null>(null)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () =>
      adminApi.getAllUsers({
        limit,
        offset: (page - 1) * limit,
        search: search || undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const handleDelete = async (user: AdminUserResponse) => {
    if (
      !confirm(
        `Вы уверены, что хотите удалить пользователя "${user.username}"? Это действие нельзя отменить.`
      )
    ) {
      return
    }
    deleteMutation.mutate(user.id)
  }

  if (isLoading) {
    return <div className="text-foreground-secondary">Загрузка пользователей...</div>
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="flex-1 rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-foreground-secondary/20">
        <table className="w-full">
          <thead className="bg-background-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Имя пользователя
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Статус
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Админ
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Дата регистрации
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground-secondary/20">
            {data?.items.map((user) => (
              <tr key={user.id} className="hover:bg-background-secondary/50">
                <td className="px-4 py-3 text-sm">{user.username}</td>
                <td className="px-4 py-3 text-sm">{user.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-red-500/20 text-red-500'
                    }`}
                  >
                    {user.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {user.is_admin ? (
                    <span className="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                      Админ
                    </span>
                  ) : (
                    <span className="text-foreground-secondary">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground-secondary">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setStatsUser(user)}
                      className="text-primary hover:text-primary/80"
                    >
                      Статистика
                    </button>
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-primary hover:text-primary/80"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={deleteMutation.isPending}
                      className="text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > limit && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-foreground-secondary">
            Показано {(page - 1) * limit + 1}-
            {Math.min(page * limit, data.total)} из {data.total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-sm disabled:opacity-50"
            >
              Назад
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= data.total}
              className="rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-sm disabled:opacity-50"
            >
              Вперёд
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
      {statsUser && (
        <UserStatsModal
          user={statsUser}
          onClose={() => setStatsUser(null)}
        />
      )}
    </div>
  )
}

export default AdminUsersTab

