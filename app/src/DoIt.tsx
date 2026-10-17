import { useState } from 'react'
import { ACTIONS, BODY_PARTS, type Action } from './data/actions'
import type { Word } from './data/words'
import { statsFor, type Progress } from './progress'
import type { Say } from './Stories'

type Props = {
  progress: Progress
  showText: boolean
  say: Say
  onHeardText: (text: string) => void
  onAnswer: (w: Word, firstTry: boolean) => void
  rounds?: number
  onDone?: () => void
}

type Round =
  | { kind: 'action'; target: Action; options: Action[]; demo: boolean; wrong: string[] }
  | { kind: 'touch'; target: Word; options: Word[]; demo: false; wrong: string[] }

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)
const weakest = <T extends Word>(pool: T[], p: Progress, lastId?: string) =>
  shuffle(pool.filter((w) => w.id !== lastId)).sort((a, b) => statsFor(p, a.id).streak - statsFor(p, b.id).streak)[0]

function newRound(p: Progress, lastId?: string): Round {
  if (Math.random() < 0.6) {
    const target = weakest(ACTIONS, p, lastId)
    const options = shuffle([target, ...shuffle(ACTIONS.filter((x) => x.id !== target.id)).slice(0, 3)])
    // First time you meet a verb, you just watch it being done — meaning by demonstration.
    return { kind: 'action', target, options, demo: statsFor(p, target.id).heard === 0, wrong: [] }
  }
  const target = weakest(BODY_PARTS, p, lastId)
  const options = shuffle([target, ...shuffle(BODY_PARTS.filter((x) => x.id !== target.id)).slice(0, 3)])
  return { kind: 'touch', target, options, demo: false, wrong: [] }
}

const command = (r: Round) => (r.kind === 'action' ? `${r.target.hanzi}！` : `摸摸${r.target.hanzi}。`)

/** TPR: hear a command and respond with an action. Verbs are first shown, then asked for. */
export function DoIt({ progress, showText, say, onHeardText, onAnswer, rounds, onDone }: Props) {
  const [round, setRound] = useState<Round | null>(null)
  const [busy, setBusy] = useState(false)
  const [count, setCount] = useState(0)

  const speak = (text: string) => {
    onHeardText(text)
    return say(text, { vary: true })
  }

  function start(lastId?: string) {
    const r = newRound(progress, lastId)
    setRound(r)
    speak(r.demo ? `${r.target.hanzi}！${r.target.hanzi}！` : command(r))
  }

  async function pick(w: Word) {
    if (!round || busy || round.wrong.includes(w.id)) return
    setBusy(true)
    if (w.id === round.target.id) {
      onAnswer(round.target, round.wrong.length === 0)
      await speak(`对！${command(round)}`)
      setBusy(false)
      setCount(count + 1)
      if (rounds && count + 1 >= rounds) onDone?.()
      else start(round.target.id)
    } else {
      setRound({ ...round, wrong: [...round.wrong, w.id] } as Round)
      await speak(round.kind === 'touch' ? `这是${w.hanzi}。${command(round)}` : `不对。${command(round)}`)
      setBusy(false)
    }
  }

  function endDemo() {
    if (!round) return
    setRound({ ...round, demo: false } as Round)
    speak(command(round))
  }

  if (!round)
    return (
      <div className="center">
        <p className="hint">Hear a command and tap who's doing it, or the body part to touch. New actions are shown first.</p>
        <button className="primary" onClick={() => start()}>▶ Start</button>
      </div>
    )

  const tile = (w: Word, extra = '') => (
    <>
      <span className={`emoji ${'anim' in w ? `anim-${(w as Action).anim}` : ''} ${extra}`}>{w.emoji}</span>
      {showText && (
        <span className="label">
          <span className="hanzi">{w.hanzi}</span>
          <span className="pinyin">{w.pinyin}</span>
        </span>
      )}
    </>
  )

  if (round.demo)
    return (
      <div className="center">
        <p className="hint">👀 New action — watch.</p>
        <button className="card demo" onClick={endDemo}>{tile(round.target)}</button>
        <div className="player">
          <button className="secondary" onClick={() => speak(`${round.target.hanzi}！${round.target.hanzi}！`)}>🔊 Again</button>
          <button className="primary" onClick={endDemo}>Got it →</button>
        </div>
      </div>
    )

  return (
    <div>
      <div className="center">
        <button className="secondary" onClick={() => speak(command(round))} disabled={busy}>🔊 Again</button>
      </div>
      <div className="grid game">
        {(round.options as Word[]).map((w) => (
          <button
            key={w.id}
            className={`card ${round.wrong.includes(w.id) ? 'wrong' : ''}`}
            onClick={() => pick(w)}
            disabled={round.wrong.includes(w.id)}
          >
            {tile(w)}
          </button>
        ))}
      </div>
    </div>
  )
}
