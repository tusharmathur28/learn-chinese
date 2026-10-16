import type { Word } from './data/words'

type Props = {
  word: Word
  showText: boolean
  onClick: () => void
  state?: 'normal' | 'right' | 'wrong'
  disabled?: boolean
}

export function WordCard({ word, showText, onClick, state = 'normal', disabled }: Props) {
  return (
    <button className={`card ${state}`} onClick={onClick} disabled={disabled}>
      <span className="emoji">{word.emoji}</span>
      {showText && (
        <span className="label">
          <span className="hanzi">{word.hanzi}</span>
          <span className="pinyin">{word.pinyin}</span>
        </span>
      )}
    </button>
  )
}
