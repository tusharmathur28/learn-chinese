import { useState } from 'react'
import { ALL_WORDS, type Word } from './data/words'
import { formatMinutes, isKnown, type Progress, type StoriesDone } from './progress'
import { recommendStory, speakFirstLine, versionFor } from './recommend'
import { DoIt } from './DoIt'
import { Ears } from './Ears'
import { Give } from './Give'
import { ShowMe } from './ShowMe'
import { StoryPlayer, type Say } from './Stories'

type Props = {
  progress: Progress
  storiesDone: StoriesDone
  listenedToday: number
  showText: boolean
  say: Say
  onHeard: (w: Word) => void
  onHeardText: (text: string) => void
  onAnswer: (w: Word, firstTry: boolean) => void
  onEar: (id: string, firstTry: boolean) => void
  onStoryComplete: (id: string) => void
}

const STEPS = [
  { id: 'ears', label: '👂 Ears' },
  { id: 'warm', label: '👆 Warm-up' },
  { id: 'doit', label: '👋 Do it' },
  { id: 'story', label: '📖 Story' },
  { id: 'give', label: '🤲 Give' },
] as const

/** Words not yet known, in order — so the warm-up moves through the scenes as you learn. */
function warmPool(p: Progress): Word[] {
  const pool = ALL_WORDS.filter((w) => !isKnown(p, w.id)).slice(0, 12)
  return pool.length >= 4 ? pool : ALL_WORDS
}

/** A guided ~10 minute session — no menus, like a parent leading the day. */
export function Today(props: Props) {
  const { progress, storiesDone, say, onHeardText } = props
  const [step, setStep] = useState(0)
  const [pool, setPool] = useState(() => warmPool(progress))
  const [story, setStory] = useState(() => versionFor(recommendStory(progress, storiesDone), storiesDone))
  const [storyOpen, setStoryOpen] = useState(false)
  const next = () => setStep((s) => s + 1)

  function restart() {
    setPool(warmPool(progress))
    setStory(versionFor(recommendStory(progress, storiesDone), storiesDone))
    setStoryOpen(false)
    setStep(0)
  }

  const games = { progress, showText: props.showText, say, onHeardText, onAnswer: props.onAnswer, onDone: next }

  return (
    <div>
      <div className="steps">
        {STEPS.map((s, i) => (
          <span key={s.id} className={i < step ? 'done' : i === step ? 'on' : ''}>
            {i < step ? '✓ ' : ''}{s.label}
          </span>
        ))}
        <span className="today-time">🎧 {formatMinutes(props.listenedToday)} today</span>
      </div>

      {step === 0 && <Ears key="ears" say={say} onEar={props.onEar} rounds={8} onDone={next} />}
      {step === 1 && <ShowMe key="warm" {...games} pool={pool} onHeard={props.onHeard} rounds={8} />}
      {step === 2 && <DoIt key="doit" {...games} rounds={6} />}
      {step === 3 &&
        (storyOpen ? (
          <StoryPlayer
            story={story}
            showText={props.showText}
            say={say}
            onHeardText={onHeardText}
            onComplete={props.onStoryComplete}
            onExit={next}
            exitLabel="Continue →"
          />
        ) : (
          <div className="center">
            <p className="hint">{storiesDone[story.id] ? 'An old favourite, told a little differently:' : 'A new story:'}</p>
            <div className="story-card">
              <span className="emoji">{story.cover}</span>
              <span className="hanzi">{story.title}</span>
            </div>
            <button className="primary" onClick={() => { speakFirstLine(story, props); setStoryOpen(true) }}>▶ Listen</button>
          </div>
        ))}
      {step === 4 && <Give key="give" {...games} rounds={5} />}
      {step === 5 && (
        <div className="center">
          <div className="stars">🌟</div>
          <p>今天很好！ <span className="pinyin">jīntiān hěn hǎo</span></p>
          <p className="hint">You listened to {formatMinutes(props.listenedToday)} of Chinese today.</p>
          <button className="primary" onClick={restart}>🔁 One more round</button>
        </div>
      )}
      {step < STEPS.length && !(STEPS[step].id === 'story' && storyOpen) && (
        <div className="center">
          <button className="link" onClick={next}>skip this step</button>
        </div>
      )}
    </div>
  )
}
