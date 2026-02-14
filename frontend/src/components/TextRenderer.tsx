interface TextRendererProps {
  text: string
  currentIndex: number
  errors: Set<number>
  className?: string
}

function TextRenderer({ text, currentIndex, errors, className = '' }: TextRendererProps) {
  const renderChar = (char: string, index: number) => {
    let charClass = 'text-foreground-tertiary' // Непройденные символы - серые

    if (index < currentIndex) {
      // Пройденные символы
      if (errors.has(index)) {
        charClass = 'text-error bg-error/10' // Ошибки - красные
      } else {
        charClass = 'text-foreground-secondary' // Правильные - серые
      }
    } else if (index === currentIndex) {
      // Текущий символ
      charClass = 'text-foreground bg-foreground-secondary/30 underline' // Подсветка текущего
    }

    // Обработка пробелов и переносов строк
    if (char === ' ') {
      return (
        <span key={index} className={charClass}>
          {'\u00A0'} {/* Неразрывный пробел для видимости */}
        </span>
      )
    }

    if (char === '\n') {
      return (
        <span key={index} className={charClass}>
          <br />
        </span>
      )
    }

    return (
      <span key={index} className={charClass}>
        {char}
      </span>
    )
  }

  return (
    <div
      className={`font-mono text-lg leading-relaxed whitespace-pre-wrap break-words ${className}`}
    >
      {text.split('').map((char, index) => renderChar(char, index))}
    </div>
  )
}

export default TextRenderer

