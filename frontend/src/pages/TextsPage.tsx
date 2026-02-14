import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { textsApi, TextCreate } from '@/api/texts'
import { useAuth } from '@/features/auth/hooks/useAuth'

function TextsPage() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<TextCreate>({
    title: '',
    content: '',
    type: 'text',
    language: '',
    is_public: false,
  })

  // Получение своих текстов
  const { data: myTexts, isLoading: isLoadingMy } = useQuery({
    queryKey: ['texts', 'my'],
    queryFn: () => textsApi.getMy(),
    enabled: isAuthenticated,
  })

  // Получение публичных текстов
  const { data: publicTexts, isLoading: isLoadingPublic } = useQuery({
    queryKey: ['texts', 'public'],
    queryFn: () => textsApi.getPublic(),
  })

  // Создание текста
  const createMutation = useMutation({
    mutationFn: (data: TextCreate) => textsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['texts'] })
      setShowCreateForm(false)
      setFormData({
        title: '',
        content: '',
        type: 'text',
        language: '',
        is_public: false,
      })
    },
  })

  // Удаление текста
  const deleteMutation = useMutation({
    mutationFn: (id: string) => textsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['texts'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      language: formData.language || undefined,
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">Тексты</h1>
        <p className="text-foreground-secondary">
          Войдите в систему, чтобы создавать и управлять своими текстами
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Тексты</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground-secondary"
        >
          {showCreateForm ? 'Отмена' : '+ Создать текст'}
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Название</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full rounded-lg border border-foreground-secondary/20 bg-background px-4 py-2 text-foreground focus:border-foreground-secondary focus:outline-none"
              placeholder="Название текста"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Тип</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as 'text' | 'code',
                })
              }
              className="w-full rounded-lg border border-foreground-secondary/20 bg-background px-4 py-2 text-foreground focus:border-foreground-secondary focus:outline-none"
            >
              <option value="text">Текст</option>
              <option value="code">Код</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Язык (опционально)</label>
            <input
              type="text"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full rounded-lg border border-foreground-secondary/20 bg-background px-4 py-2 text-foreground focus:border-foreground-secondary focus:outline-none"
              placeholder="ru, en, js, python..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Содержание</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={8}
              className="w-full rounded-lg border border-foreground-secondary/20 bg-background px-4 py-2 font-mono text-sm text-foreground focus:border-foreground-secondary focus:outline-none"
              placeholder="Введите текст или код..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="h-4 w-4 rounded border-foreground-secondary/20 bg-background text-foreground focus:ring-2 focus:ring-foreground-secondary"
            />
            <label htmlFor="is_public" className="text-sm">
              Сделать публичным
            </label>
          </div>

          {createMutation.error && (
            <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : 'Ошибка при создании текста'}
            </div>
          )}

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-colors hover:bg-foreground-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Создание...' : 'Создать'}
          </button>
        </form>
      )}

      <div className="space-y-8">
        {/* Мои тексты */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Мои тексты</h2>
          {isLoadingMy ? (
            <div className="text-foreground-secondary">Загрузка...</div>
          ) : myTexts && myTexts.items.length > 0 ? (
            <div className="space-y-4">
              {myTexts.items.map((text) => (
                <div
                  key={text.id}
                  className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{text.title}</h3>
                      <p className="mt-1 text-sm text-foreground-secondary">
                        Тип: {text.type === 'text' ? 'Текст' : 'Код'}
                        {text.language && ` • Язык: ${text.language}`}
                        {text.is_public && ' • Публичный'}
                      </p>
                      <p className="mt-2 font-mono text-sm text-foreground-tertiary line-clamp-2">
                        {text.content}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(text.id)}
                      disabled={deleteMutation.isPending}
                      className="ml-4 rounded-lg border border-error/20 bg-error/10 px-3 py-1 text-sm text-error transition-colors hover:bg-error/20 disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground-secondary">У вас пока нет текстов</p>
          )}
        </div>

        {/* Публичные тексты */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Публичные тексты</h2>
          {isLoadingPublic ? (
            <div className="text-foreground-secondary">Загрузка...</div>
          ) : publicTexts && publicTexts.items.length > 0 ? (
            <div className="space-y-4">
              {publicTexts.items.map((text) => (
                <div
                  key={text.id}
                  className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-4"
                >
                  <h3 className="font-semibold text-foreground">{text.title}</h3>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    Тип: {text.type === 'text' ? 'Текст' : 'Код'}
                    {text.language && ` • Язык: ${text.language}`}
                  </p>
                  <p className="mt-2 font-mono text-sm text-foreground-tertiary line-clamp-2">
                    {text.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground-secondary">Публичных текстов пока нет</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TextsPage
