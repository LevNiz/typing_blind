import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type AdminTextCreate } from '@/api/admin'

interface TextCreateModalProps {
  onClose: () => void
}

function TextCreateModal({ onClose }: TextCreateModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<AdminTextCreate>({
    title: '',
    content: '',
    type: 'text',
    language: '',
    is_public: false,
  })

  const createMutation = useMutation({
    mutationFn: (data: AdminTextCreate) => adminApi.createText(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'texts'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg border border-foreground-secondary/20 bg-background p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-semibold">Создать текст</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary">
              Название
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-foreground focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary">
              Тип
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as 'text' | 'code',
                })
              }
              className="mt-1 w-full rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-foreground focus:border-primary focus:outline-none"
            >
              <option value="text">Текст</option>
              <option value="code">Код</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary">
              Язык (опционально)
            </label>
            <input
              type="text"
              value={formData.language}
              onChange={(e) =>
                setFormData({ ...formData, language: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-foreground focus:border-primary focus:outline-none"
              placeholder="ru, en, python, javascript..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary">
              Содержимое
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={10}
              className="mt-1 w-full rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) =>
                  setFormData({ ...formData, is_public: e.target.checked })
                }
                className="h-4 w-4 rounded border-foreground-secondary/20 text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground-secondary">
                Публичный текст
              </span>
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
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TextCreateModal

