import { useEffect, useRef, useState } from 'react'
import { STORIES, type Question, type Story } from './data/stories'
import { tokenize } from './data/tokenize'
import { toPinyin } from './data/pinyin'
import type { Progress, StoriesDone } from './progress'
import { recommendStory, speakFirstLine, versionFor } from './recommend'
import { generateStory } from './data/generate'
import type { SpeakOptions } from './speech'
import { Echo } from './Echo'
import { Pic } from './Pic'

export type Say = (text: string, opts?: SpeakOptions) => Promise<void>

type Props = {
  completed: StoriesDone
  progress: Progress
  showText: boolean
  say: Say
  onHeardText: (text: string) => void
  onComplete: (storyId: string) => void
}

export function Stories(props: Props) {
  const [open, setOpen] = useState<Story | null>(null)
  const next = recommendStory(props.progress, props.completed)

  function openStory(s: Story) {
    const version = versionFor(s, props.completed)
    speakFirstLine(version, props)
    setOpen(version)
  }

  if (open) return <StoryPlayer key={open.id} story={open} {...props} onExit={() => setOpen(null)} />

  return (
    <div className="story-list">
      <button className="story-card next" onClick={() => openStory(generateStory(props.progress))}>
        <span className="emoji">✨</span>
        <span className="hanzi">小故事</span>
        <small>new mini-story from words you know</small>
      </button>
      {STORIES.map((s, i) => (
        <button key={s.id} className={`story-card ${s.id === next.id ? 'next' : ''}`} onClick={() => openStory(s)}>
          <span className="emoji">{s.cover}</span>
          <span className="hanzi">{s.title}</span>
          <small>
            {i + 1}. {props.completed[s.id] ? `✓ ${props.completed[s.id]}×` : 'new'}
            {s.id === next.id && ' · ⭐ next'}
          </small>
        </button>
      ))}
    </div>
  )
}

/** The emoji for the word at `charIndex` in `text`, if that word has one. */
function emojiAt(text: string, charIndex: number): string | null {
  let pos = 0
  for (const t of tokenize(text)) {
    if (charIndex < pos + t.text.length) return t.word?.emoji || null
    pos += t.text.length
  }
  return null
}

/** Up to 4 lines with distinct pictures, spread across the story, for the put-in-order step. */
function orderLines(story: Story): number[] {
  const seen = new Set<string>()
  const unique = story.lines.flatMap((l, i) => (seen.has(l.pic) ? [] : (seen.add(l.pic), [i])))
  const n = Math.min(4, unique.length)
  if (n < 2) return unique
  return [...new Set(Array.from({ length: n }, (_, k) => unique[Math.round((k * (unique.length - 1)) / (n - 1))]))]
}

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

type Phase = 'listen' | 'quiz' | 'order' | 'done'
type PlayerProps = Omit<Props, 'completed' | 'progress'> & { story: Story; onExit: () => void; exitLabel?: string }

export function StoryPlayer({ story, showText, say, onHeardText, onComplete, onExit, exitLabel = 'Back to stories' }: PlayerProps) {
  const [phase, setPhase] = useState<Phase>('listen')
  const [line, setLine] = useState(0)
  const [auto, setAuto] = useState(false)
  const [hl, setHl] = useState<string | null>(null)
  const [qi, setQi] = useState(0)
  const [wrong, setWrong] = useState<number[]>([])
  const [firstTry, setFirstTry] = useState(0)
  const [busy, setBusy] = useState(false)
  const [order] = useState(() => orderLines(story))
  const [cards] = useState(() => shuffle(order))
  const [placed, setPlaced] = useState(0)
  const [shake, setShake] = useState<number | null>(null)
  // Circling: questions asked right after a line; `resume` continues auto-play afterwards.
  const [asking, setAsking] = useState<{ line: number; qi: number; wrong: number[]; resume: boolean } | null>(null)
  const asked = useRef(new Set<number>())
  // Bumped on every navigation so a finished utterance from an old line can't auto-advance.
  const playId = useRef(0)

  const speakAndCount = (text: string, opts?: SpeakOptions) => {
    onHeardText(text)
    return say(text, opts)
  }

  async function playLine(i: number, continueAuto: boolean) {
    const id = ++playId.current
    setLine(i)
    const text = story.lines[i].zh
    await speakAndCount(text, { onWord: (c) => id === playId.current && setHl(emojiAt(text, c)) })
    if (id !== playId.current) return
    setHl(null)
    if (story.lines[i].ask && !asked.current.has(i)) {
      asked.current.add(i)
      setAsking({ line: i, qi: 0, wrong: [], resume: continueAuto })
      speakAndCount(story.lines[i].ask![0].q, { vary: true })
      return
    }
    if (continueAuto) continueFrom(i, id)
  }

  async function continueFrom(i: number, id: number) {
    if (i + 1 < story.lines.length) {
      await new Promise((r) => setTimeout(r, 600))
      if (id === playId.current) playLine(i + 1, true)
    } else {
      setAuto(false)
    }
  }

  async function answerAsk(k: number) {
    const a = asking
    if (!a || busy || a.wrong.includes(k)) return
    const asks = story.lines[a.line].ask!
    const q = asks[a.qi]
    setBusy(true)
    if (k === q.answer) {
      // Restate the fact: one more repetition of the line.
      await speakAndCount(`对！${story.lines[a.line].zh}`)
      if (a.qi + 1 < asks.length) {
        setAsking({ ...a, qi: a.qi + 1, wrong: [] })
        speakAndCount(asks[a.qi + 1].q, { vary: true })
      } else {
        setAsking(null)
        if (a.resume) continueFrom(a.line, ++playId.current)
      }
    } else {
      setAsking({ ...a, wrong: [...a.wrong, k] })
      await speakAndCount(`不对。${q.q}`, { vary: true })
    }
    setBusy(false)
  }

  function go(i: number) {
    setAuto(false)
    setAsking(null)
    if (i >= story.lines.length) return startQuiz()
    playLine(Math.max(0, i), false)
  }

  function toggleAuto() {
    if (auto) {
      playId.current++
      setAuto(false)
      setAsking(null)
      setHl(null)
    } else {
      setAuto(true)
      playLine(line, true)
    }
  }

  function startQuiz() {
    playId.current++
    setHl(null)
    setPhase('quiz')
    askQuestion(0)
  }

  function askQuestion(i: number) {
    setQi(i)
    setWrong([])
    speakAndCount(story.questions[i].q, { vary: true })
  }

  async function answer(i: number) {
    const q = story.questions[qi]
    if (busy || wrong.includes(i)) return
    setBusy(true)
    const say_ = q.options[i].say
    if (say_) await speakAndCount(say_)
    if (i === q.answer) {
      if (wrong.length === 0) setFirstTry((n) => n + 1)
      await speakAndCount('对！')
      if (qi + 1 < story.questions.length) askQuestion(qi + 1)
      else setPhase('order')
    } else {
      setWrong([...wrong, i])
      await speakAndCount(`不对。${q.q}`, { vary: true })
    }
    setBusy(false)
  }

  async function place(lineIdx: number) {
    if (busy) return
    if (lineIdx !== order[placed]) {
      setShake(lineIdx)
      setTimeout(() => setShake(null), 400)
      return
    }
    setBusy(true)
    setPlaced(placed + 1)
    await speakAndCount(story.lines[lineIdx].zh)
    setBusy(false)
    if (placed + 1 === order.length) {
      setPhase('done')
      onComplete(story.id)
    }
  }

  // Stop any auto-advance when leaving the story.
  useEffect(() => {
    const ref = playId
    return () => {
      ref.current++
    }
  }, [])

  const header = (
    <div className="story-head">
      <button className="secondary" onClick={onExit}>←</button>
      <span className="hanzi">{story.title}</span>
    </div>
  )

  if (phase === 'done')
    return (
      <div>
        {header}
        <div className="center">
          <div className="stars">{'⭐'.repeat(firstTry)}{'☆'.repeat(story.questions.length - firstTry)}</div>
          <p className="hint">{firstTry} / {story.questions.length} questions right on the first try</p>
          {story.note && (
            <details className="note">
              <summary>💡 How it works</summary>
              <p>{story.note}</p>
            </details>
          )}
          <button className="primary" onClick={onExit}>{exitLabel}</button>
        </div>
      </div>
    )

  if (phase === 'order')
    return (
      <div>
        {header}
        <div className="center">
          <p className="hint">What happened first? Tap the pictures in story order.</p>
          <div className="order-slots">
            {order.map((li, k) => (
              <div key={li} className="slot">
                {k < placed ? <Pic pic={story.lines[li].pic} /> : <span className="slot-num">{k + 1}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="options">
          {cards.map((li) =>
            order.indexOf(li) < placed ? null : (
              <button key={li} className={`card ${shake === li ? 'shake' : ''}`} onClick={() => place(li)}>
                <Pic pic={story.lines[li].pic} />
              </button>
            ),
          )}
        </div>
      </div>
    )

  if (phase === 'quiz') {
    const q = story.questions[qi]
    return (
      <div>
        {header}
        <div className="center">
          <p className="hint">Question {qi + 1} / {story.questions.length}</p>
          {q.pic && <Pic pic={q.pic} className="stage small-stage" />}
          {showText && <Caption zh={q.q} />}
          <button className="secondary" onClick={() => say(q.q, { vary: true })} disabled={busy}>🔊 Again</button>
        </div>
        <div className="options">
          {q.options.map((o, i) => (
            <button key={i} className={`card ${wrong.includes(i) ? 'wrong' : ''}`} onClick={() => answer(i)} disabled={wrong.includes(i)}>
              <Pic pic={o.pic} />
              {showText && o.say && <span className="hanzi">{o.say}</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const l = story.lines[line]
  return (
    <div>
      {header}
      <div className="center">
        <Pic pic={l.pic} className="stage" highlight={hl} />
        {showText && <Caption zh={l.zh} />}
        {asking ? (
          <AskPanel
            q={l.ask![asking.qi]}
            wrong={asking.wrong}
            showText={showText}
            busy={busy}
            onAnswer={answerAsk}
            onAgain={() => say(l.ask![asking.qi].q, { vary: true })}
            onSkip={() => go(line + 1)}
          />
        ) : (
        <>
        <div className="player">
          <button className="secondary" onClick={() => go(line - 1)} disabled={line === 0}>⏮</button>
          <button className="secondary" onClick={() => go(line)}>🔊</button>
          <button className="primary" onClick={toggleAuto}>{auto ? '⏸ Pause' : '▶ Play'}</button>
          <button className="secondary" onClick={() => go(line + 1)}>{line + 1 < story.lines.length ? '⏭' : 'Questions →'}</button>
        </div>
        <div className="dots">
          {story.lines.map((_, i) => (
            <button key={i} className={i === line ? 'on' : ''} onClick={() => go(i)} aria-label={`line ${i + 1}`} />
          ))}
        </div>
        <Echo key={line} text={l.zh} say={say} />
        </>
        )}
      </div>
    </div>
  )
}

type AskProps = {
  q: Question
  wrong: number[]
  showText: boolean
  busy: boolean
  onAnswer: (i: number) => void
  onAgain: () => void
  onSkip: () => void
}

function AskPanel({ q, wrong, showText, busy, onAnswer, onAgain, onSkip }: AskProps) {
  return (
    <div className="ask">
      {showText && <Caption zh={q.q} />}
      <button className="secondary" onClick={onAgain} disabled={busy}>🔊 Again</button>
      <div className="options">
        {q.options.map((o, i) => (
          <button key={i} className={`card ${wrong.includes(i) ? 'wrong' : ''}`} onClick={() => onAnswer(i)} disabled={wrong.includes(i)}>
            <Pic pic={o.pic} />
            {showText && o.say && <span className="hanzi">{o.say}</span>}
          </button>
        ))}
      </div>
      <button className="link" onClick={onSkip}>skip</button>
    </div>
  )
}

function Caption({ zh }: { zh: string }) {
  return (
    <div className="caption">
      <div className="hanzi">{zh}</div>
      <div className="pinyin">{toPinyin(zh)}</div>
    </div>
  )
}
