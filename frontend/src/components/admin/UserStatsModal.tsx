import { useQuery } from '@tanstack/react-query'
import { adminApi, type AdminUserResponse } from '@/api/admin'

interface UserStatsModalProps {
  user: AdminUserResponse
  onClose: () => void
}

function UserStatsModal({ user, onClose }: UserStatsModalProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'users', user.id, 'stats'],
    queryFn: () => adminApi.getUserStats(user.id),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-foreground-secondary/20 bg-background p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Статистика: {user.username}
        </h2>

        {isLoading ? (
          <div className="text-foreground-secondary">Загрузка...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-4">
                <div className="text-sm text-foreground-secondary">
                  Всего тренировок
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {stats?.total_trainings ?? 0}
                </div>
              </div>

              <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-4">
                <div className="text-sm text-foreground-secondary">Всего текстов</div>
                <div className="mt-1 text-2xl font-bold">
                  {stats?.total_texts ?? 0}
                </div>
              </div>

              <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-4">
                <div className="text-sm text-foreground-secondary">Средний WPM</div>
                <div className="mt-1 text-2xl font-bold">
                  {stats?.avg_wpm ?? 0}
                </div>
              </div>

              <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-4">
                <div className="text-sm text-foreground-secondary">Средний CPM</div>
                <div className="mt-1 text-2xl font-bold">
                  {stats?.avg_cpm ?? 0}
                </div>
              </div>

              <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-4">
                <div className="text-sm text-foreground-secondary">
                  Средняя точность
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {stats?.avg_accuracy ?? 0}%
                </div>
              </div>

              <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-4">
                <div className="text-sm text-foreground-secondary">
                  Всего ошибок
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {stats?.total_errors ?? 0}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-foreground-secondary/20 bg-background-secondary px-4 py-2 text-sm hover:bg-background-secondary/80"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserStatsModal

