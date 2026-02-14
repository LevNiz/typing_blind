import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { trainingsApi } from '@/api/trainings'

function ProfilePage() {
  const { user, isLoadingUser } = useAuth()

  // Получение истории тренировок
  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['trainings', 'history'],
    queryFn: () => trainingsApi.getHistory(),
  })

  if (isLoadingUser) {
    return <div className="text-foreground-secondary">Загрузка...</div>
  }

  if (!user) {
    return <div className="text-error">Пользователь не найден</div>
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-3xl font-bold">Профиль</h1>

      {/* Информация о пользователе */}
      <div className="mb-8 space-y-4 rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6">
        <div>
          <label className="text-sm font-medium text-foreground-secondary">
            Имя пользователя
          </label>
          <p className="mt-1 text-lg text-foreground">{user.username}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground-secondary">
            Email
          </label>
          <p className="mt-1 text-lg text-foreground">{user.email}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground-secondary">
            Дата регистрации
          </label>
          <p className="mt-1 text-lg text-foreground">
            {new Date(user.created_at).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground-secondary">
            Статус
          </label>
          <p className="mt-1 text-lg text-foreground">
            {user.is_active ? (
              <span className="text-green-500">Активен</span>
            ) : (
              <span className="text-error">Неактивен</span>
            )}
          </p>
        </div>
      </div>

      {/* История тренировок */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Последние тренировки</h2>
        {isLoadingHistory ? (
          <div className="text-foreground-secondary">Загрузка...</div>
        ) : history && history.items.length > 0 ? (
          <div className="space-y-4">
            {history.items.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="rounded-lg border border-foreground-secondary/20 bg-background-secondary p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">
                      {session.mode === 'text' ? 'Текст' : 'Код'}
                    </div>
                    <div className="mt-1 text-sm text-foreground-secondary">
                      {new Date(session.created_at).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-foreground">
                      {session.wpm} WPM
                    </div>
                    <div className="text-sm text-foreground-secondary">
                      {session.accuracy.toFixed(1)}% точность
                    </div>
                    <div className="text-sm text-error">{session.errors} ошибок</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-foreground-secondary">У вас пока нет тренировок</p>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
