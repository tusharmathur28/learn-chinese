import { useState } from 'react'
import { pairId, SOUND_PAIRS, TONE_MARKS, TONE_SETS, toneId, type EarItem } from './data/ears'
import type { Say } from './Stories'

type Props = {
  say: Say
  onEar: (id: string, firstTry: boolean) => void
  rounds?: number
  onDone?: () => void
}

type Round = { options: EarItem[]; answer: number; ids: string[]; picked: number[]; kind: 'tone' | 'sound' }

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

function newRound(): Round {
  if (Math.random() < 0.6) {
    const set = pick(TONE_SETS)
    return { kind: 'tone', options: set, answer: Math.floor(Math.random() * 4), ids: [1, 2, 3, 4].map(toneId), picked: [] }
  }
  const pair = pick(SOUND_PAIRS)
  const id = pairId(pair)
  return { kind: 'sound', options: pair, answer: Math.floor(Math.random() * 2), ids: [id, id], picked: [] }
}

/** Ear training — hear one syllable (in a random voice), pick its tone or sound. */
export function Ears({ say, onEar, rounds, onDone }: Props) {
  const [round, setRound] = useState<Round | null>(null)
  const [busy, setBusy] = useState(false)
  const [count, setCount] = useState(0)
  const [score, setScore] = useState(0)

  const play = (r: Round) => say(r.options[r.answer].hanzi, { vary: true })

  function start() {
    const r = newRound()
    setRound(r)
    play(r)
  }

  async function choose(i: number) {
    if (!round || busy || round.picked.includes(round.answer)) return
    setBusy(true)
    const firstTry = round.picked.length === 0
    const r = { ...round, picked: [...round.picked, i] }
    setRound(r)
    if (i === round.answer) {
      onEar(round.ids[round.answer], firstTry)
      if (firstTry) setScore(score + 1)
      await say(round.options[i].hanzi, { vary: true })
    } else {
      // Contrast: what you picked, then what it was.
      await say(round.options[i].hanzi, { vary: true })
      await new Promise((res) => setTimeout(res, 300))
      await say(round.options[round.answer].hanzi, { vary: true })
    }
    setBusy(false)
  }

  function next() {
    setCount(count + 1)
    if (rounds && count + 1 >= rounds) onDone?.()
    else start()
  }

  if (!round)
    return (
      <div className="center">
        <p className="hint">Train your ear: hear a syllable, pick its tone (ˉ ˊ ˇ ˋ) or which sound it was. Voices vary on purpose.</p>
        <button className="primary" onClick={start}>▶ Start</button>
      </div>
    )

  const solved = round.picked.includes(round.answer)
  return (
    <div className="center">
      <p className="hint">{round.kind === 'tone' ? 'Which tone?' : 'Which sound?'} {count > 0 && `· ${score}/${count + (solved ? 1 : 0)} first try`}</p>
      <button className="secondary" onClick={() => play(round)} disabled={busy}>🔊 Again</button>
      <div className={`ear-options ${round.kind}`}>
        {round.options.map((o, i) => (
          <button
            key={i}
            className={`card ear ${round.picked.includes(i) ? (i === round.answer ? 'right' : 'wrong') : ''}`}
            onClick={() => (solved ? say(o.hanzi, { vary: true }) : choose(i))}
          >
            <span className="mark">{round.kind === 'tone' ? TONE_MARKS[i] : o.pinyin}</span>
            {solved && (
              <span className="label">
                <span className="hanzi">{o.hanzi}</span>
                {round.kind === 'tone' && <span className="pinyin">{o.pinyin}</span>}
              </span>
            )}
          </button>
        ))}
      </div>
      {solved && (
        <>
          <p className="hint">Tap any card to compare.</p>
          <button className="primary" onClick={next}>Next →</button>
        </>
      )}
    </div>
  )
}
