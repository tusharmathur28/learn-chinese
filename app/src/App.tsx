import { useEffect, useState } from 'react'
import { ALL_WORDS, SCENES, type Word } from './data/words'
import {
  answered, heard, loadListening, loadProgress, loadStoriesDone, saveListening, saveProgress, saveStoriesDone, today,
  type Progress,
} from './progress'
import { tokenize } from './data/tokenize'
import { initVoices, setListenHandler, speak, type SpeakOptions } from './speech'
import { Explore } from './Explore'
import { ShowMe } from './ShowMe'
import { DoIt } from './DoIt'
import { Give } from './Give'
import { Ears } from './Ears'
import { ProgressView } from './ProgressView'
import { Stories } from './Stories'
import { Today } from './Today'
import { Read } from './Read'

type Tab = 'today' | 'explore' | 'games' | 'stories' | 'read' | 'progress'
type Game = 'ears' | 'showme' | 'doit' | 'give'

const TABS: Record<Tab, string> = {
  today: '☀️ Today', explore: '👂 Explore', games: '🎮 Games', stories: '📖 Stories', read: '📝 Read', progress: '📈 Progress',
}
const GAMES: Record<Game, string> = { ears: '👂 Ears', showme: '👆 Show me', doit: '👋 Do it', give: '🤲 Give' }

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [game, setGame] = useState<Game>('showme')
  const [sceneId, setSceneId] = useState(SCENES[0].id)
  const [showText, setShowText] = useState(false)
  const [slow, setSlow] = useState(false)
  const [voiceOk, setVoiceOk] = useState(true)
  const [progress, setProgressState] = useState<Progress>(loadProgress)
  const [storiesDone, setStoriesDone] = useState(loadStoriesDone)
  const [listening, setListening] = useState(loadListening)

  useEffect(() => {
    initVoices().then(setVoiceOk)
    setListenHandler((ms) =>
      setListening((l) => {
        const next = { ...l, [today()]: (l[today()] ?? 0) + ms / 1000 }
        saveListening(next)
        return next
      }),
    )
  }, [])

  const update = (fn: (p: Progress) => Progress) =>
    setProgressState((p) => {
      const next = fn(p)
      saveProgress(next)
      return next
    })

  const say = (text: string, opts?: SpeakOptions) => speak(text, slow ? 0.6 : 0.9, opts)
  const onHeard = (w: Word) => update((p) => heard(p, w.id))
  const onHeardText = (text: string) =>
    update((p) => tokenize(text).reduce((acc, t) => (t.word ? heard(acc, t.word.id) : acc), p))
  const onAnswer = (w: Word, first: boolean) => update((p) => answered(p, w.id, first))
  const onEar = (id: string, first: boolean) => update((p) => answered(p, id, first))
  const onStoryComplete = (id: string) =>
    !id.startsWith('gen-') && // generated stories are one-offs; don't track them
    setStoriesDone((s) => {
      const next = { ...s, [id]: (s[id] ?? 0) + 1 }
      saveStoriesDone(next)
      return next
    })
  const hear = (w: Word) => {
    onHeard(w)
    say(`${w.hanzi}！这是${w.hanzi}。`, { vary: true })
  }
  function reset() {
    update(() => ({}))
    setStoriesDone({})
    saveStoriesDone({})
    setListening({})
    saveListening({})
  }

  const scene = SCENES.find((s) => s.id === sceneId)
  const pool = scene ? scene.words : ALL_WORDS
  const showScenes = tab === 'explore' || (tab === 'games' && game === 'showme')
  const gameProps = { progress, showText, say, onHeardText, onAnswer }

  return (
    <div className="app">
      <header>
        <h1>听 <span className="pinyin">tīng</span></h1>
        <nav>
          {(Object.keys(TABS) as Tab[]).map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{TABS[t]}</button>
          ))}
        </nav>
        <div className="toggles">
          <label><input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> Slow</label>
          <label><input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} /> Show text</label>
        </div>
      </header>

      {!voiceOk && (
        <div className="warn">
          No Chinese voice found. <b>Windows:</b> use Microsoft Edge, or add “Chinese (Simplified)” under Settings → Time
          &amp; language → Speech. <b>iPhone:</b> Settings → Accessibility → Spoken Content → Voices → Chinese.{' '}
          <b>Android:</b> Settings → Text-to-speech → install Chinese voice data.
        </div>
      )}

      {tab === 'games' && (
        <div className="scenes">
          {(Object.keys(GAMES) as Game[]).map((g) => (
            <button key={g} className={game === g ? 'active' : ''} onClick={() => setGame(g)}>{GAMES[g]}</button>
          ))}
        </div>
      )}

      {showScenes && (
        <div className="scenes">
          {SCENES.map((s) => (
            <button key={s.id} className={s.id === sceneId ? 'active' : ''} onClick={() => { setSceneId(s.id); say(s.hanzi) }}>
              {s.emoji} {s.hanzi}
            </button>
          ))}
          {tab === 'games' && (
            <button className={sceneId === 'all' ? 'active' : ''} onClick={() => setSceneId('all')}>
              🌏 全部
            </button>
          )}
        </div>
      )}

      <main>
        {tab === 'today' && (
          <Today
            {...gameProps}
            storiesDone={storiesDone}
            listenedToday={listening[today()] ?? 0}
            onHeard={onHeard}
            onEar={onEar}
            onStoryComplete={onStoryComplete}
          />
        )}
        {tab === 'explore' && <Explore scene={scene ?? SCENES[0]} showText={showText} onHear={hear} />}
        {tab === 'games' && game === 'showme' && <ShowMe key={sceneId} {...gameProps} pool={pool} onHeard={onHeard} />}
        {tab === 'games' && game === 'ears' && <Ears say={say} onEar={onEar} />}
        {tab === 'games' && game === 'doit' && <DoIt {...gameProps} />}
        {tab === 'games' && game === 'give' && <Give {...gameProps} />}
        {tab === 'stories' && (
          <Stories
            completed={storiesDone}
            progress={progress}
            showText={showText}
            say={say}
            onHeardText={onHeardText}
            onComplete={onStoryComplete}
          />
        )}
        {tab === 'read' && <Read progress={progress} completed={storiesDone} say={say} onHeardText={onHeardText} />}
        {tab === 'progress' && <ProgressView progress={progress} listening={listening} onHear={hear} onReset={reset} />}
      </main>
    </div>
  )
}
