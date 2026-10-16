import { useState } from 'react'
import type { Word } from './data/words'
import { statsFor, type Progress } from './progress'
import { WordCard } from './WordCard'

type Props = {
  pool: Word[]
  progress: Progress
  showText: boolean
  say: (text: string) => Promise<void>
  onHeard: (w: Word) => void
  onAnswer: (w: Word, firstTry: boolean) => void
}

type Round = { target: Word; options: Word[]; wrong: string[] }

const PROMPTS = ['{w}在哪儿？', '哪个是{w}？', '请点{w}。', '我要{w}。']
const OPTIONS = 4

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)
const prompt = (w: Word) => PROMPTS[Math.floor(Math.random() * PROMPTS.length)].replace('{w}', w.hanzi)

/** Least-practised words come up most; never the same word twice in a row. */
function newRound(pool: Word[], progress: Progress, lastId?: string): Round {
  const candidates = shuffle(pool.filter((w) => w.id !== lastId))
    .sort((a, b) => statsFor(progress, a.id).streak - statsFor(progress, b.id).streak)
    .slice(0, 3)
  const target = candidates[Math.floor(Math.random() * candidates.length)]
  const others = shuffle(pool.filter((w) => w.id !== target.id)).slice(0, OPTIONS - 1)
  return { target, options: shuffle([target, ...others]), wrong: [] }
}

/** "Show me" — hear a word, tap the matching picture. Answer by action, not speech. */
export function ShowMe({ pool, progress, showText, say, onHeard, onAnswer }: Props) {
  const [round, setRound] = useState<Round | null>(null)
  const [solved, setSolved] = useState(false)
  const [busy, setBusy] = useState(false)

  async function start(last?: string) {
    const r = newRound(pool, progress, last)
    setRound(r)
    setSolved(false)
    onHeard(r.target)
    await say(prompt(r.target))
  }

  async function pick(w: Word) {
    if (!round || solved || busy) return
    setBusy(true)
    if (w.id === round.target.id) {
      setSolved(true)
      onAnswer(w, round.wrong.length === 0)
      onHeard(w)
      await say(`对！${w.hanzi}。`)
      setBusy(false)
      await start(w.id)
    } else {
      // A wrong tap is still input: name what they tapped, then ask again.
      setRound({ ...round, wrong: [...round.wrong, w.id] })
      onHeard(w)
      onHeard(round.target)
      await say(`这是${w.hanzi}。${round.target.hanzi}在哪儿？`)
      setBusy(false)
    }
  }

  if (pool.length < OPTIONS) return <p className="hint">Need at least {OPTIONS} words.</p>

  if (!round)
    return (
      <div className="center">
        <p className="hint">You'll hear a word. Tap the picture that matches.</p>
        <button className="primary" onClick={() => start()}>
          ▶ Start
        </button>
      </div>
    )

  return (
    <div>
      <div className="center">
        <button className="secondary" onClick={() => say(prompt(round.target))} disabled={busy}>
          🔊 Again
        </button>
      </div>
      <div className="grid game">
        {round.options.map((w) => (
          <WordCard
            key={w.id}
            word={w}
            showText={showText}
            onClick={() => pick(w)}
            state={solved && w.id === round.target.id ? 'right' : round.wrong.includes(w.id) ? 'wrong' : 'normal'}
            disabled={round.wrong.includes(w.id)}
          />
        ))}
      </div>
    </div>
  )
}
