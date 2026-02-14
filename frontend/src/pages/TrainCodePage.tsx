import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import TypingTrainer from '@/components/TypingTrainer'
import { textsApi } from '@/api/texts'

// Пример кода для тренировки
const DEFAULT_CODE = `function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 10);
console.log(result));`

function TrainCodePage() {
  const [selectedTextId, setSelectedTextId] = useState<string | undefined>(undefined)
  const [code, setCode] = useState(DEFAULT_CODE)
  const [codeKey, setCodeKey] = useState(0)
  const [isWikipediaActive, setIsWikipediaActive] = useState(false)
  const queryClient = useQueryClient()

  // Получение своих текстов типа "code"
  const { data: myTexts } = useQuery({
    queryKey: ['texts', 'my', 'code'],
    queryFn: () => textsApi.getMy({ type: 'code' }),
  })

  // Получение публичных текстов типа "code"
  const { data: publicTexts } = useQuery({
    queryKey: ['texts', 'public', 'code'],
    queryFn: () => textsApi.getPublic({ type: 'code' }),
  })

  const handleFinish = (stats: {
    wpm: number
    cpm: number
    accuracy: number
    errors: number
    correctChars: number
    durationSec: number
  }) => {
    console.log('Training finished:', stats)
    // Инвалидируем кэш истории тренировок, чтобы обновить список
    queryClient.invalidateQueries({ queryKey: ['trainings', 'history'] })
    // Также инвалидируем кэш лидерборда, если тренировка завершена
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
  }

  const handleTextSelect = async (textId: string) => {
    try {
      const selectedText = await textsApi.getById(textId)
      setCode(selectedText.content)
      setSelectedTextId(textId)
      setIsWikipediaActive(false)
      setCodeKey((prev) => prev + 1)
    } catch (error) {
      console.error('Failed to load text:', error)
    }
  }

  const handleReset = () => {
    setCode(DEFAULT_CODE)
    setSelectedTextId(undefined)
    setIsWikipediaActive(false)
    setCodeKey((prev) => prev + 1)
  }

  // Mutation для получения случайного текста из Wikipedia
  const wikipediaMutation = useMutation({
    mutationFn: (params?: { language?: string; length?: number }) =>
      textsApi.getWikipediaRandom(params),
    onSuccess: (data) => {
      setCode(data.content)
      setSelectedTextId(undefined)
      setIsWikipediaActive(true)
      setCodeKey((prev) => prev + 1)
    },
    onError: (error) => {
      console.error('Failed to load Wikipedia text:', error)
      alert('Не удалось загрузить текст из Wikipedia. Попробуйте еще раз.')
    },
  })

  const handleWikipediaRandom = () => {
    wikipediaMutation.mutate({ language: 'ru', length: 500 })
  }

  const allTexts = [
    ...(myTexts?.items || []),
    ...(publicTexts?.items || []).filter(
      (t) => !myTexts?.items.some((mt) => mt.id === t.id)
    ),
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-3xl font-bold">Тренировка: Код</h1>

      {/* Компактная панель выбора текста */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-foreground-secondary/20 bg-background-secondary p-3">
        <button
          onClick={handleReset}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            !selectedTextId && !isWikipediaActive
              ? 'border-foreground bg-foreground/10 text-foreground'
              : 'border-foreground-secondary/20 bg-background text-foreground-secondary hover:bg-background-tertiary'
          }`}
        >
          Стандартный
        </button>

        <button
          onClick={handleWikipediaRandom}
          disabled={wikipediaMutation.isPending}
          title={isWikipediaActive ? 'Загрузить новый текст из Wikipedia' : 'Загрузить случайный текст из Wikipedia'}
          className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isWikipediaActive
              ? 'border-foreground bg-foreground/10 text-foreground'
              : 'border-foreground-secondary/20 bg-background text-foreground-secondary hover:bg-background-tertiary'
          }`}
        >
          {wikipediaMutation.isPending ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-foreground-secondary border-t-transparent"></div>
              <span>Загрузка...</span>
            </>
          ) : (
            <>
              <span>Wikipedia</span>
              {isWikipediaActive && (
                <span className="text-xs">↻</span>
              )}
            </>
          )}
        </button>

        {allTexts.length > 0 && (
          <select
            value={selectedTextId || ''}
            onChange={(e) => {
              if (e.target.value) {
                handleTextSelect(e.target.value)
              } else {
                handleReset()
              }
            }}
            className="flex-1 min-w-[200px] rounded-md border border-foreground-secondary/20 bg-background px-3 py-1.5 text-sm text-foreground-secondary focus:border-foreground focus:outline-none"
          >
            <option value="">Мои тексты...</option>
            {allTexts.map((textItem) => (
              <option key={textItem.id} value={textItem.id}>
                {textItem.title}
                {textItem.is_public ? ' (Публичный)' : ''}
              </option>
            ))}
          </select>
        )}

        {allTexts.length === 0 && (
          <span className="text-xs text-foreground-tertiary">
            Нет текстов.{' '}
            <a href="/texts" className="text-foreground underline">
              Создать
            </a>
          </span>
        )}
      </div>

      <TypingTrainer
        key={codeKey}
        text={code}
        mode="code"
        textId={selectedTextId}
        onFinish={handleFinish}
      />
    </div>
  )
}

export default TrainCodePage
