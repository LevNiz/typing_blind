import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { leaderboardApi, LeaderboardPeriod, TrainingMode } from '@/api/leaderboard'

function LeaderboardPage() {
  const [mode, setMode] = useState<TrainingMode>('text')
  const [period, setPeriod] = useState<LeaderboardPeriod>('all')
  const [sortBy, setSortBy] = useState<'wpm' | 'accuracy'>('wpm')

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', mode, period, sortBy],
    queryFn: () => leaderboardApi.get({ mode, period, sort_by: sortBy }),
  })

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-8 text-3xl font-bold">Рейтинг</h1>

      {/* Фильтры */}
      <div className="mb-6 space-y-4 rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Режим</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as TrainingMode)}
              className="w-full rounded-lg border border-foreground-secondary/20 bg-background px-4 py-2 text-foreground focus:border-foreground-secondary focus:outline-none"
            >
              <option value="text">Текст</option>
              <option value="code">Код</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Период</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as LeaderboardPeriod)}
              className="w-full rounded-lg border border-foreground-secondary/20 bg-background px-4 py-2 text-foreground focus:border-foreground-secondary focus:outline-none"
            >
              <option value="day">День</option>
              <option value="week">Неделя</option>
              <option value="month">Месяц</option>
              <option value="all">Всё время</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Сортировка</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'wpm' | 'accuracy')}
              className="w-full rounded-lg border border-foreground-secondary/20 bg-background px-4 py-2 text-foreground focus:border-foreground-secondary focus:outline-none"
            >
              <option value="wpm">По WPM</option>
              <option value="accuracy">По точности</option>
            </select>
          </div>
        </div>
      </div>

      {/* Таблица рейтинга */}
      {isLoading ? (
        <div className="text-center py-12 text-foreground-secondary">Загрузка...</div>
      ) : leaderboard && leaderboard.items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-foreground-secondary/20 bg-background-secondary">
          <table className="w-full">
            <thead>
              <tr className="border-b border-foreground-secondary/20">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                  Место
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                  WPM
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                  CPM
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                  Точность
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                  Ошибки
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                  Время
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground-secondary/10">
              {leaderboard.items.map((entry, index) => (
                <tr
                  key={entry.user_id}
                  className="hover:bg-background-tertiary transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && (
                        <span className="mr-2 text-yellow-500">🥇</span>
                      )}
                      {index === 1 && (
                        <span className="mr-2 text-gray-400">🥈</span>
                      )}
                      {index === 2 && (
                        <span className="mr-2 text-orange-600">🥉</span>
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {entry.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-foreground">
                      {Math.round(entry.wpm)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-foreground-secondary">
                      {Math.round(entry.cpm)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-foreground-secondary">
                      {entry.accuracy.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-error">{entry.errors}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-foreground-secondary">
                      {Math.floor(entry.duration_sec / 60)}:
                      {(entry.duration_sec % 60).toString().padStart(2, '0')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-foreground-secondary">
          Нет данных для отображения
        </div>
      )}

      {leaderboard && leaderboard.total > 0 && (
        <div className="mt-4 text-center text-sm text-foreground-secondary">
          Всего записей: {leaderboard.total}
        </div>
      )}
    </div>
  )
}

export default LeaderboardPage
