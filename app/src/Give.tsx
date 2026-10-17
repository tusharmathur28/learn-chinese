import { useRef, useState, type PointerEvent } from 'react'
import { PEOPLE } from './data/actions'
import { SCENES, STORY_WORDS, type Word } from './data/words'
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

const people = PEOPLE.map((id) => STORY_WORDS.find((w) => w.id === id)!)
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

/** Things you can hand someone, preferring ones you've already heard. */
function itemPool(p: Progress): Word[] {
  const all = SCENES.filter((s) => s.id === 'food' || s.id === 'things').flatMap((s) => s.words)
  const heard = all.filter((w) => statsFor(p, w.id).heard > 0)
  return heard.length >= 4 ? heard : all.slice(0, 8)
}

type Round = { item: Word; person: Word; items: Word[]; wrong: number; given: string | null }

function newRound(p: Progress, lastId?: string): Round {
  const pool = itemPool(p).filter((w) => w.id !== lastId)
  const items = shuffle(pool).slice(0, 4)
  return { item: items[0], person: people[Math.floor(Math.random() * people.length)], items: shuffle(items), wrong: 0, given: null }
}

const command = (r: Round) => `把${r.item.hanzi}给${r.person.hanzi}。`

/** "Give the apple to Mum": hear a whole sentence, act it out by dragging (or tap item, then tap person). */
export function Give({ progress, showText, say, onHeardText, onAnswer, rounds, onDone }: Props) {
  const [round, setRound] = useState<Round | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ id: string; x0: number; y0: number; dx: number; dy: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [count, setCount] = useState(0)
  const personRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  // Drag start lives in a ref so a very quick tap (down+up before a re-render) still registers.
  const dragStart = useRef<{ id: string; x0: number; y0: number } | null>(null)

  const speak = (text: string) => {
    onHeardText(text)
    return say(text, { vary: true })
  }

  function start(lastId?: string) {
    const r = newRound(progress, lastId)
    setRound(r)
    setSelected(null)
    speak(command(r))
  }

  async function give(itemId: string, personId: string) {
    if (!round || busy) return
    setSelected(null)
    setBusy(true)
    const item = round.items.find((w) => w.id === itemId)!
    const person = people.find((w) => w.id === personId)!
    if (item.id === round.item.id && person.id === round.person.id) {
      onAnswer(round.item, round.wrong === 0)
      setRound({ ...round, given: personId })
      await speak(`对！${person.hanzi}有${item.hanzi}了。`)
      setBusy(false)
      setCount(count + 1)
      if (rounds && count + 1 >= rounds) onDone?.()
      else start(round.item.id)
    } else {
      setRound({ ...round, wrong: round.wrong + 1 })
      await speak(`不对。${command(round)}`)
      setBusy(false)
    }
  }

  const onDown = (id: string) => (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { id, x0: e.clientX, y0: e.clientY }
    setDrag({ id, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 })
  }
  const onMove = (e: PointerEvent) => drag && setDrag({ ...drag, dx: e.clientX - drag.x0, dy: e.clientY - drag.y0 })
  const onUp = (e: PointerEvent) => {
    const start = dragStart.current
    if (!start) return
    dragStart.current = null
    setDrag(null)
    if (Math.hypot(e.clientX - start.x0, e.clientY - start.y0) <= 10) {
      // Tap instead of drag: select it (and hear its name), then tap a person.
      setSelected(start.id)
      speak(round!.items.find((w) => w.id === start.id)!.hanzi)
      return
    }
    const hit = Object.entries(personRefs.current).find(([, el]) => {
      const r = el?.getBoundingClientRect()
      return r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    })
    if (hit) give(start.id, hit[0])
  }

  if (!round)
    return (
      <div className="center">
        <p className="hint">Hear who gets what. Drag the thing onto the person (or tap it, then tap the person).</p>
        <button className="primary" onClick={() => start()}>▶ Start</button>
      </div>
    )

  return (
    <div>
      <div className="center">
        <button className="secondary" onClick={() => speak(command(round))} disabled={busy}>🔊 Again</button>
      </div>
      <div className="people">
        {people.map((p) => (
          <button
            key={p.id}
            ref={(el) => void (personRefs.current[p.id] = el)}
            className={`card person ${selected ? 'target' : ''}`}
            onClick={() => selected && give(selected, p.id)}
          >
            <span className="emoji">{p.emoji}</span>
            {round.given === p.id && <span className="received">{round.item.emoji}</span>}
            {showText && <span className="hanzi">{p.hanzi}</span>}
          </button>
        ))}
      </div>
      <div className="items">
        {round.items.map((w) =>
          round.given && w.id === round.item.id ? (
            <span key={w.id} className="item-gone" />
          ) : (
            <button
              key={w.id}
              className={`card item ${selected === w.id ? 'selected' : ''}`}
              style={drag?.id === w.id ? { transform: `translate(${drag.dx}px, ${drag.dy}px)`, zIndex: 10 } : undefined}
              onPointerDown={onDown(w.id)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={() => { dragStart.current = null; setDrag(null) }}
            >
              <span className="emoji">{w.emoji}</span>
              {showText && <span className="hanzi">{w.hanzi}</span>}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
