import { ALL_WORDS, SCENES, STORY_WORDS, type Word } from './data/words'
import { ACTIONS } from './data/actions'
import { VOCAB } from './data/tokenize'
import { formatMinutes, isKnown, statsFor, today, type ListeningLog, type Progress } from './progress'
import { STICKY } from './recommend'

type Props = { progress: Progress; listening: ListeningLog; onHear: (w: Word) => void; onReset: () => void }

export function ProgressView({ progress, listening, onHear, onReset }: Props) {
  const known = ALL_WORDS.filter((w) => isKnown(progress, w.id)).length
  const actionsKnown = ACTIONS.filter((w) => isKnown(progress, w.id)).length
  const exposures = VOCAB.reduce((n, w) => n + statsFor(progress, w.id).heard, 0)
  const totalSeconds = Object.values(listening).reduce((n, s) => n + s, 0)

  /** Quizzed words: known after 3 right in a row. */
  const chip = (w: Word) => {
    const st = statsFor(progress, w.id)
    const status = isKnown(progress, w.id) ? 'known' : st.heard > 0 ? 'heard' : 'new'
    return (
      <button key={w.id} className={`chip ${status}`} onClick={() => onHear(w)} title={`heard ${st.heard}× · ✓${st.correct} ✗${st.wrong}`}>
        {w.emoji} {w.hanzi} <span className="pinyin">{w.pinyin}</span> <small>{st.heard}×</small>
      </button>
    )
  }

  return (
    <div>
      <div className="stats">
        <div><b>{formatMinutes(totalSeconds)}</b> of Chinese heard ({formatMinutes(listening[today()] ?? 0)} today)</div>
        <div><b>{known}</b> / {ALL_WORDS.length} picture words known</div>
        <div><b>{actionsKnown}</b> / {ACTIONS.length} actions known</div>
        <div><b>{exposures}</b> words heard in total</div>
      </div>
      {SCENES.map((s) => (
        <section key={s.id}>
          <h3>{s.emoji} {s.hanzi} <span className="pinyin">{s.pinyin}</span></h3>
          <div className="progress-list">{s.words.map(chip)}</div>
        </section>
      ))}
      <section>
        <h3>👋 动作 <span className="pinyin">dòngzuò</span> — actions</h3>
        <div className="progress-list">{ACTIONS.map(chip)}</div>
      </section>
      <section>
        <h3>📖 故事 <span className="pinyin">gùshi</span> — story words (sticky after {STICKY}×)</h3>
        <div className="progress-list">
          {STORY_WORDS.map((w) => {
            const n = statsFor(progress, w.id).heard
            return (
              <button key={w.id} className={`chip ${n >= STICKY ? 'known' : n > 0 ? 'heard' : 'new'}`} onClick={() => onHear(w)}>
                {w.emoji} {w.hanzi} <span className="pinyin">{w.pinyin}</span> <small>{n}×</small>
              </button>
            )
          })}
        </div>
      </section>
      <p className="legend">
        <span className="chip new">new</span> <span className="chip heard">heard</span>{' '}
        <span className="chip known">known (3 right in a row / heard {STICKY}×)</span>
      </p>
      <button className="danger" onClick={() => confirm('Reset all progress?') && onReset()}>
        Reset progress
      </button>
    </div>
  )
}
