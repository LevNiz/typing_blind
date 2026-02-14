import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'

function AdminStatsTab() {
  const { data: generalStats, isLoading: isLoadingGeneral } = useQuery({
    queryKey: ['admin', 'stats', 'general'],
    queryFn: () => adminApi.getGeneralStats(),
  })

  const { data: trainingStats, isLoading: isLoadingTraining } = useQuery({
    queryKey: ['admin', 'stats', 'training', 'all'],
    queryFn: () => adminApi.getTrainingStats('all'),
  })

  const { data: userActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['admin', 'stats', 'users'],
    queryFn: () => adminApi.getUserActivityStats(),
  })

  if (isLoadingGeneral || isLoadingTraining || isLoadingActivity) {
    return <div className="text-foreground-secondary">Загрузка статистики...</div>
  }

  return (
    <div className="space-y-6">
      {/* General Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6">
          <div className="text-sm font-medium text-foreground-secondary">
            Всего пользователей
          </div>
          <div className="mt-2 text-3xl font-bold text-foreground">
            {generalStats?.total_users ?? 0}
          </div>
        </div>

        <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6">
          <div className="text-sm font-medium text-foreground-secondary">
            Активных (30 дней)
          </div>
          <div className="mt-2 text-3xl font-bold text-foreground">
            {generalStats?.active_users_30d ?? 0}
          </div>
        </div>

        <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6">
          <div className="text-sm font-medium text-foreground-secondary">
            Всего текстов
          </div>
          <div className="mt-2 text-3xl font-bold text-foreground">
            {generalStats?.total_texts ?? 0}
          </div>
        </div>

        <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6">
          <div className="text-sm font-medium text-foreground-secondary">
            Всего тренировок
          </div>
          <div className="mt-2 text-3xl font-bold text-foreground">
            {generalStats?.total_trainings ?? 0}
          </div>
        </div>

        <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6">
          <div className="text-sm font-medium text-foreground-secondary">
            Средний WPM
          </div>
          <div className="mt-2 text-3xl font-bold text-foreground">
            {generalStats?.avg_wpm ?? 0}
          </div>
        </div>

        <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6">
          <div className="text-sm font-medium text-foreground-secondary">
            Средняя точность
          </div>
          <div className="mt-2 text-3xl font-bold text-foreground">
            {generalStats?.avg_accuracy ?? 0}%
          </div>
        </div>
      </div>

      {/* Training Stats */}
      <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6">
        <h2 className="mb-4 text-xl font-semibold">Статистика тренировок</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div className="text-sm text-foreground-secondary">Всего</div>
            <div className="text-2xl font-bold">{trainingStats?.total ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-foreground-secondary">Средний WPM</div>
            <div className="text-2xl font-bold">{trainingStats?.avg_wpm ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-foreground-secondary">Средний CPM</div>
            <div className="text-2xl font-bold">{trainingStats?.avg_cpm ?? 0}</div>
          </div>
          <div>
            <div className="text-sm text-foreground-secondary">Средняя точность</div>
            <div className="text-2xl font-bold">
              {trainingStats?.avg_accuracy ?? 0}%
            </div>
          </div>
        </div>
      </div>

      {/* User Activity */}
      <div className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6">
        <h2 className="mb-4 text-xl font-semibold">Активность пользователей</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-foreground-secondary">
              Зарегистрировано за 30 дней
            </div>
            <div className="text-2xl font-bold">
              {userActivity?.recent_users_30d ?? 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-foreground-secondary">
              Активных за 30 дней
            </div>
            <div className="text-2xl font-bold">
              {userActivity?.active_users_30d ?? 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminStatsTab

