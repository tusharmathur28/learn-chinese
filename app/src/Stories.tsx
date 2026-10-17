import { useEffect, useRef, useState } from 'react'
import { STORIES, type Story } from './data/stories'
import { toPinyin } from './data/tokenize'
import { Pic } from './Pic'

type Props = {
  completed: Record<string, number>
  showText: boolean
  say: (text: string) => Promise<void>
  onHeardText: (text: string) => void
  onComplete: (storyId: string) => void
}

export function Stories(props: Props) {
  const [open, setOpen] = useState<Story | null>(null)

  // iOS Safari only allows speech started synchronously inside a tap handler,
  // so the first line is spoken here rather than after the player mounts.
  function openStory(s: Story) {
    props.onHeardText(s.lines[0].zh)
    props.say(s.lines[0].zh)
    setOpen(s)
  }

  if (open) return <StoryPlayer key={open.id} story={open} {...props} onExit={() => setOpen(null)} />

  return (
    <div className="story-list">
      {STORIES.map((s, i) => (
        <button key={s.id} className="story-card" onClick={() => openStory(s)}>
          <span className="emoji">{s.cover}</span>
          <span className="hanzi">{s.title}</span>
          <small>
            {i + 1}. {props.completed[s.id] ? `✓ ${props.completed[s.id]}×` : 'new'}
          </small>
        </button>
      ))}
    </div>
  )
}

type Phase = 'listen' | 'quiz' | 'done'

function StoryPlayer({ story, showText, say, onHeardText, onComplete, onExit }: Props & { story: Story; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>('listen')
  const [line, setLine] = useState(0)
  const [auto, setAuto] = useState(false)
  const [qi, setQi] = useState(0)
  const [wrong, setWrong] = useState<number[]>([])
  const [firstTry, setFirstTry] = useState(0)
  const [busy, setBusy] = useState(false)
  // Bumped on every navigation so a finished utterance from an old line can't auto-advance.
  const playId = useRef(0)

  const speakAndCount = (text: string) => {
    onHeardText(text)
    return say(text)
  }

  async function playLine(i: number, continueAuto: boolean) {
    const id = ++playId.current
    setLine(i)
    await speakAndCount(story.lines[i].zh)
    if (!continueAuto || id !== playId.current) return
    if (i + 1 < story.lines.length) {
      await new Promise((r) => setTimeout(r, 600))
      if (id === playId.current) playLine(i + 1, true)
    } else {
      setAuto(false)
    }
  }

  function go(i: number) {
    setAuto(false)
    if (i >= story.lines.length) return startQuiz()
    playLine(Math.max(0, i), false)
  }

  function toggleAuto() {
    if (auto) {
      playId.current++
      setAuto(false)
    } else {
      setAuto(true)
      playLine(line, true)
    }
  }

  function startQuiz() {
    playId.current++
    setPhase('quiz')
    askQuestion(0)
  }

  function askQuestion(i: number) {
    setQi(i)
    setWrong([])
    speakAndCount(story.questions[i].q)
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
      else {
        setPhase('done')
        onComplete(story.id)
      }
    } else {
      setWrong([...wrong, i])
      await speakAndCount(`不对。${q.q}`)
    }
    setBusy(false)
  }

  // The first line is spoken by the click that opened the story (see open() above);
  // here we only stop any auto-advance when leaving the story.
  useEffect(() => {
    const ref = playId
    return () => {
      ref.current++
    }
  }, [])

  const header = (
    <div className="story-head">
      <button className="secondary" onClick={onExit}>← Stories</button>
      <span className="hanzi">{story.title}</span>
    </div>
  )

  if (phase === 'done')
    return (
      <div>
        {header}
        <div className="center">
          <div className="stars">{'⭐'.repeat(firstTry)}{'☆'.repeat(story.questions.length - firstTry)}</div>
          <p className="hint">{firstTry} / {story.questions.length} right on the first try</p>
          <button className="primary" onClick={() => { setPhase('listen'); setFirstTry(0); go(0) }}>🔁 Listen again</button>
          <button className="secondary" onClick={onExit}>Back to stories</button>
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
          <button className="secondary" onClick={() => say(q.q)} disabled={busy}>🔊 Again</button>
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
        <Pic pic={l.pic} className="stage" />
        {showText && <Caption zh={l.zh} />}
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
      </div>
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
