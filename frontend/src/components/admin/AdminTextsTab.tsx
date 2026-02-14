import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type AdminTextResponse } from '@/api/admin'
import TextEditModal from './TextEditModal'
import TextCreateModal from './TextCreateModal'

function AdminTextsTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'text' | 'code' | 'all'>('all')
  const [page, setPage] = useState(1)
  const [editingText, setEditingText] = useState<AdminTextResponse | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'texts', page, search, typeFilter],
    queryFn: () =>
      adminApi.getAllTexts({
        limit,
        offset: (page - 1) * limit,
        search: search || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (textId: string) => adminApi.deleteText(textId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'texts'] })
    },
  })

  const handleDelete = async (text: AdminTextResponse) => {
    if (
      !confirm(
        `Вы уверены, что хотите удалить текст "${text.title}"? Это действие нельзя отменить.`
      )
    ) {
      return
    }
    deleteMutation.mutate(text.id)
  }

  if (isLoading) {
    return <div className="text-foreground-secondary">Загрузка текстов...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters and Create Button */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Поиск по названию или содержимому..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="flex-1 rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-foreground focus:border-primary focus:outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as 'text' | 'code' | 'all')
            setPage(1)
          }}
          className="rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-foreground focus:border-primary focus:outline-none"
        >
          <option value="all">Все типы</option>
          <option value="text">Текст</option>
          <option value="code">Код</option>
        </select>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
        >
          Создать текст
        </button>
      </div>

      {/* Texts Table */}
      <div className="overflow-x-auto rounded-lg border border-foreground-secondary/20">
        <table className="w-full">
          <thead className="bg-background-secondary">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Название
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Тип
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Язык
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Публичный
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Длина
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                Дата создания
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground-secondary/20">
            {data?.items.map((text) => (
              <tr key={text.id} className="hover:bg-background-secondary/50">
                <td className="px-4 py-3 text-sm">
                  <div className="max-w-xs truncate" title={text.title}>
                    {text.title}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      text.type === 'text'
                        ? 'bg-blue-500/20 text-blue-500'
                        : 'bg-purple-500/20 text-purple-500'
                    }`}
                  >
                    {text.type === 'text' ? 'Текст' : 'Код'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-foreground-secondary">
                  {text.language || '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {text.is_public ? (
                    <span className="text-green-500">Да</span>
                  ) : (
                    <span className="text-foreground-secondary">Нет</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground-secondary">
                  {text.content.length} симв.
                </td>
                <td className="px-4 py-3 text-sm text-foreground-secondary">
                  {new Date(text.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingText(text)}
                      className="text-primary hover:text-primary/80"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(text)}
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
      {editingText && (
        <TextEditModal
          text={editingText}
          onClose={() => setEditingText(null)}
        />
      )}
      {showCreateModal && (
        <TextCreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

export default AdminTextsTab

