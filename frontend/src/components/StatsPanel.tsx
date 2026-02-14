interface StatsPanelProps {
  wpm: number
  cpm: number
  accuracy: number
  errors: number
  timeElapsed: number
}

function StatsPanel({ wpm, cpm, accuracy, errors, timeElapsed }: StatsPanelProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 rounded-lg border border-foreground-secondary/20 bg-background-secondary p-4">
      <div>
        <div className="text-sm text-foreground-secondary">WPM</div>
        <div className="text-2xl font-bold text-foreground">{Math.round(wpm)}</div>
      </div>
      <div>
        <div className="text-sm text-foreground-secondary">CPM</div>
        <div className="text-2xl font-bold text-foreground">{Math.round(cpm)}</div>
      </div>
      <div>
        <div className="text-sm text-foreground-secondary">Точность</div>
        <div className="text-2xl font-bold text-foreground">
          {accuracy.toFixed(1)}%
        </div>
      </div>
      <div>
        <div className="text-sm text-foreground-secondary">Ошибки</div>
        <div className="text-2xl font-bold text-error">{errors}</div>
      </div>
      <div>
        <div className="text-sm text-foreground-secondary">Время</div>
        <div className="text-2xl font-bold text-foreground">
          {formatTime(timeElapsed)}
        </div>
      </div>
    </div>
  )
}

export default StatsPanel

