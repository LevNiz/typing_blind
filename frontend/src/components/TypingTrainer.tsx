import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import TextRenderer from './TextRenderer'
import StatsPanel from './StatsPanel'
import { trainingsApi, TrainingFinishRequest } from '@/api/trainings'

interface TypingTrainerProps {
  text: string
  mode: 'text' | 'code'
  textId?: string
  onFinish?: (stats: {
    wpm: number
    cpm: number
    accuracy: number
    errors: number
    correctChars: number
    durationSec: number
  }) => void
  key?: string | number // Для принудительного пересоздания компонента при смене текста
}

function TypingTrainer({ text, mode, textId, onFinish }: TypingTrainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [errors, setErrors] = useState<Set<number>>(new Set())
  const [isStarted, setIsStarted] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previousTextRef = useRef<string>(text)
  // Refs для хранения актуальных значений при завершении
  const currentIndexRef = useRef(0)
  const errorsRef = useRef<Set<number>>(new Set())
  const timeElapsedRef = useRef(0)
  const isFinishingRef = useRef(false) // Защита от двойного вызова finishTraining

  // Синхронизация refs с состоянием
  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    errorsRef.current = errors
  }, [errors])

  useEffect(() => {
    timeElapsedRef.current = timeElapsed
  }, [timeElapsed])

  // Статистика
  const correctChars = currentIndex - errors.size
  const wpm = timeElapsed > 0 ? (correctChars / 5) / (timeElapsed / 60) : 0
  const cpm = timeElapsed > 0 ? (correctChars / timeElapsed) * 60 : 0
  const accuracy =
    currentIndex > 0 ? ((currentIndex - errors.size) / currentIndex) * 100 : 100

  // Начать тренировку
  const startTraining = useCallback(async () => {
    try {
      const response = await trainingsApi.start({
        mode,
        text_id: textId,
      })
      setSessionId(response.session_id)
      setIsStarted(true)
      currentIndexRef.current = 0
      errorsRef.current = new Set()
      timeElapsedRef.current = 0
      setTimeElapsed(0)

      // Запустить таймер
      intervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const newTime = prev + 1
          timeElapsedRef.current = newTime
          return newTime
        })
      }, 1000)
    } catch (error) {
      console.error('Failed to start training:', error)
    }
  }, [mode, textId])

  // Завершить тренировку
  const finishTraining = useCallback(async () => {
    if (!sessionId || !isStarted) return

    // Защита от двойного вызова
    if (isFinishingRef.current || isFinished) return
    isFinishingRef.current = true

    // Остановить таймер сразу (на случай, если еще не остановлен)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsFinished(true)
    setIsStarted(false)

    // Используем актуальные значения из refs для расчета статистики
    const finalIndex = currentIndexRef.current
    const finalErrors = errorsRef.current
    const finalTime = timeElapsedRef.current

    // Вычисляем финальную статистику
    const finalCorrectChars = finalIndex - finalErrors.size
    const finalWpm = finalTime > 0 ? (finalCorrectChars / 5) / (finalTime / 60) : 0
    const finalCpm = finalTime > 0 ? (finalCorrectChars / finalTime) * 60 : 0
    const finalAccuracy =
      finalIndex > 0 ? ((finalIndex - finalErrors.size) / finalIndex) * 100 : 100

    const stats: TrainingFinishRequest = {
      session_id: sessionId,
      wpm: Math.round(finalWpm),
      cpm: Math.round(finalCpm),
      accuracy: Math.round(finalAccuracy * 10) / 10,
      errors: finalErrors.size,
      correct_chars: finalCorrectChars,
      duration_sec: finalTime,
    }

    try {
      await trainingsApi.finish(stats)

      if (onFinish) {
        onFinish({
          wpm: stats.wpm,
          cpm: stats.cpm,
          accuracy: stats.accuracy,
          errors: stats.errors,
          correctChars: stats.correct_chars,
          durationSec: stats.duration_sec,
        })
      }
    } catch (error) {
      console.error('Failed to finish training:', error)
    }
  }, [sessionId, isStarted, onFinish])

  // Обработка ввода
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isFinished || !isStarted) return

      const input = e.target.value
      const expectedChar = text[currentIndex]

      // Обработка удаления (Backspace)
      if (input.length < currentIndex) {
        const newIndex = Math.max(0, input.length)
        currentIndexRef.current = newIndex
        setCurrentIndex(newIndex)
        // Удаляем ошибку, если она была на удалённой позиции
        setErrors((prev) => {
          const newErrors = new Set(prev)
          for (let i = newIndex; i < currentIndex; i++) {
            newErrors.delete(i)
          }
          errorsRef.current = newErrors
          return newErrors
        })
        return
      }

      if (input.length > currentIndex + 1) {
        // Блокировка вставки текста
        e.target.value = input.slice(0, currentIndex + 1)
        return
      }

      if (input.length === currentIndex + 1) {
        const typedChar = input[currentIndex]

        if (typedChar === expectedChar) {
          const newIndex = currentIndex + 1
          currentIndexRef.current = newIndex
          setCurrentIndex(newIndex)
          
          // Проверка завершения после обновления индекса
          if (newIndex >= text.length) {
            // Останавливаем таймер сразу
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            setTimeout(() => finishTraining(), 0)
          }
        } else {
          // Ошибка
          const newErrors = new Set(errors)
          newErrors.add(currentIndex)
          errorsRef.current = newErrors
          setErrors(newErrors)
          const newIndex = currentIndex + 1
          currentIndexRef.current = newIndex
          setCurrentIndex(newIndex)
          
          // Проверка завершения после обновления индекса
          if (newIndex >= text.length) {
            // Останавливаем таймер сразу
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            setTimeout(() => finishTraining(), 0)
          }
        }
      }
    },
    [currentIndex, text, isStarted, isFinished, finishTraining]
  )

  // Обработка клавиатурных событий
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Блокировка специальных клавиш во время тренировки (кроме Backspace)
      if (isStarted && !isFinished) {
        if (
          e.key === 'Delete' ||
          (e.ctrlKey && e.key !== 'Backspace') ||
          (e.metaKey && e.key !== 'Backspace') ||
          (e.altKey && e.key !== 'Backspace')
        ) {
          e.preventDefault()
        }
        // Backspace разрешён для исправления ошибок
      }

      // Фокус на input при нажатии любой клавиши
      if (!isStarted && !isFinished && inputRef.current) {
        inputRef.current.focus()
        startTraining()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isStarted, isFinished, startTraining])

  // Сброс тренировки при смене текста
  useEffect(() => {
    // Проверяем, изменился ли текст
    if (previousTextRef.current === text) {
      previousTextRef.current = text
      return
    }

    // Если тренировка активна и текст изменился, завершаем текущую сессию
    const previousSessionId = sessionId
    const wasStarted = isStarted && !isFinished
    const previousTime = timeElapsed
    const previousErrors = errors.size
    const previousCorrectChars = correctChars
    const previousWpm = timeElapsed > 0 ? (previousCorrectChars / 5) / (previousTime / 60) : 0
    const previousCpm = timeElapsed > 0 ? (previousCorrectChars / previousTime) * 60 : 0
    const previousAccuracy = currentIndex > 0 ? ((currentIndex - previousErrors) / currentIndex) * 100 : 100
    
    // Сбрасываем состояние для нового текста
    currentIndexRef.current = 0
    errorsRef.current = new Set()
    timeElapsedRef.current = 0
    setCurrentIndex(0)
    setErrors(new Set())
    setIsStarted(false)
    setIsFinished(false)
    setTimeElapsed(0)
    setSessionId(null)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Завершаем предыдущую сессию асинхронно, если она была активна
    if (wasStarted && previousSessionId && previousTime > 0) {
      const stats: TrainingFinishRequest = {
        session_id: previousSessionId,
        wpm: Math.round(previousWpm),
        cpm: Math.round(previousCpm),
        accuracy: Math.round(previousAccuracy * 10) / 10,
        errors: previousErrors,
        correct_chars: previousCorrectChars,
        duration_sec: previousTime,
      }
      
      trainingsApi.finish(stats)
        .catch((error) => {
          console.error('Failed to finish previous training session:', error)
        })
    }
    
    previousTextRef.current = text
  }, [text, sessionId, isStarted, isFinished, timeElapsed, errors, currentIndex, correctChars]) // Срабатывает при изменении text

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <StatsPanel
        wpm={wpm}
        cpm={cpm}
        accuracy={accuracy}
        errors={errors.size}
        timeElapsed={timeElapsed}
      />

      <div className="relative rounded-lg border border-foreground-secondary/20 bg-background-secondary p-6">
        <TextRenderer
          text={text}
          currentIndex={currentIndex}
          errors={errors}
          className="min-h-[200px]"
        />

        {/* Скрытый input для ввода */}
        {!isFinished && (
          <input
            ref={inputRef}
            type="text"
            value={text.slice(0, currentIndex)}
            onChange={handleInput}
            onPaste={(e) => e.preventDefault()} // Блокировка вставки
            className="absolute opacity-0 pointer-events-none"
            autoFocus
          />
        )}

        {/* Индикатор прогресса */}
        <div className="mt-4 h-1 bg-foreground-secondary/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground"
            initial={{ width: 0 }}
            animate={{
              width: `${(currentIndex / text.length) * 100}%`,
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {!isStarted && !isFinished && (
        <div className="text-center text-foreground-secondary">
          Нажмите любую клавишу, чтобы начать
        </div>
      )}

      {isFinished && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h2 className="text-2xl font-bold">Тренировка завершена!</h2>
          <div className="text-foreground-secondary">
            WPM: {Math.round(wpm)} | Точность: {accuracy.toFixed(1)}% | Ошибки:{' '}
            {errors.size}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default TypingTrainer

