import { useEffect, useState } from 'react'
import { ALL_WORDS, SCENES, type Word } from './data/words'
import { answered, heard, loadProgress, loadStoriesDone, saveProgress, saveStoriesDone, type Progress } from './progress'
import { tokenize } from './data/tokenize'
import { initVoices, speak } from './speech'
import { Explore } from './Explore'
import { ShowMe } from './ShowMe'
import { ProgressView } from './ProgressView'
import { Stories } from './Stories'

type Tab = 'explore' | 'game' | 'stories' | 'progress'

export default function App() {
  const [tab, setTab] = useState<Tab>('explore')
  const [sceneId, setSceneId] = useState(SCENES[0].id)
  const [showText, setShowText] = useState(false)
  const [slow, setSlow] = useState(false)
  const [voiceOk, setVoiceOk] = useState(true)
  const [progress, setProgressState] = useState<Progress>(loadProgress)
  const [storiesDone, setStoriesDone] = useState(loadStoriesDone)

  useEffect(() => {
    initVoices().then(setVoiceOk)
  }, [])

  const update = (fn: (p: Progress) => Progress) =>
    setProgressState((p) => {
      const next = fn(p)
      saveProgress(next)
      return next
    })

  const say = (text: string) => speak(text, slow ? 0.6 : 0.9)
  const onHeard = (w: Word) => update((p) => heard(p, w.id))
  const onHeardText = (text: string) =>
    update((p) => tokenize(text).reduce((acc, t) => (t.word ? heard(acc, t.word.id) : acc), p))
  const onStoryComplete = (id: string) =>
    setStoriesDone((s) => {
      const next = { ...s, [id]: (s[id] ?? 0) + 1 }
      saveStoriesDone(next)
      return next
    })
  const hear = (w: Word) => {
    onHeard(w)
    say(`${w.hanzi}！这是${w.hanzi}。`)
  }

  const scene = SCENES.find((s) => s.id === sceneId)
  const pool = scene ? scene.words : ALL_WORDS

  return (
    <div className="app">
      <header>
        <h1>听 <span className="pinyin">tīng</span></h1>
        <nav>
          {(['explore', 'game', 'stories', 'progress'] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {{ explore: '👂 Explore', game: '👆 Show me', stories: '📖 Stories', progress: '📈 Progress' }[t]}
            </button>
          ))}
        </nav>
        <div className="toggles">
          <label><input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> Slow</label>
          <label><input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} /> Show text</label>
        </div>
      </header>

      {!voiceOk && (
        <div className="warn">
          No Chinese voice found in this browser. Open the app in <b>Microsoft Edge</b> (best free voices), or add
          “Chinese (Simplified)” under Windows Settings → Time &amp; language → Speech.
        </div>
      )}

      {(tab === 'explore' || tab === 'game') && (
        <div className="scenes">
          {SCENES.map((s) => (
            <button key={s.id} className={s.id === sceneId ? 'active' : ''} onClick={() => { setSceneId(s.id); say(s.hanzi) }}>
              {s.emoji} {s.hanzi}
            </button>
          ))}
          {tab === 'game' && (
            <button className={sceneId === 'all' ? 'active' : ''} onClick={() => setSceneId('all')}>
              🌏 全部
            </button>
          )}
        </div>
      )}

      <main>
        {tab === 'explore' && <Explore scene={scene ?? SCENES[0]} showText={showText} onHear={hear} />}
        {tab === 'game' && (
          <ShowMe
            key={sceneId}
            pool={pool}
            progress={progress}
            showText={showText}
            say={say}
            onHeard={onHeard}
            onAnswer={(w, first) => update((p) => answered(p, w.id, first))}
          />
        )}
        {tab === 'stories' && (
          <Stories completed={storiesDone} showText={showText} say={say} onHeardText={onHeardText} onComplete={onStoryComplete} />
        )}
        {tab === 'progress' && <ProgressView progress={progress} onHear={hear} onReset={() => { update(() => ({})); setStoriesDone({}); saveStoriesDone({}) }} />}
      </main>
    </div>
  )
}
