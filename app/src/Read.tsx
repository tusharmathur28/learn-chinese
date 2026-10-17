import { useState } from 'react'
import { ALL_CHARS, charPinyin, FAMILIES, PICTOGRAPHS, wordsWith } from './data/hanzi'
import { STORIES, type Story } from './data/stories'
import { tokenize } from './data/tokenize'
import type { Word } from './data/words'
import { STICKY, statsFor, type Progress, type StoriesDone } from './progress'
import { Pic } from './Pic'
import type { Say } from './Stories'

type Props = { progress: Progress; completed: StoriesDone; say: Say; onHeardText: (text: string) => void }

/** Reading comes after listening: a character unlocks once a word containing it has been heard enough. */
export function Read({ progress, completed, say, onHeardText }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [reading, setReading] = useState<Story | null>(null)

  const ready = (ch: string) => wordsWith(ch).some((w) => statsFor(progress, w.id).heard >= STICKY)
  const readyCount = ALL_CHARS.filter(ready).length
  const grouped = new Set(PICTOGRAPHS + FAMILIES.map((f) => f.chars).join(''))
  const other = ALL_CHARS.filter((c) => !grouped.has(c)).join('')
  const hear = (w: Word) => {
    onHeardText(w.hanzi)
    say(w.hanzi)
  }

  if (reading) return <ReadStory story={reading} say={say} onHeardText={onHeardText} onBack={() => setReading(null)} />

  const tiles = (chars: string) => (
    <div className="char-row">
      {[...chars].map((c) => (
        <button
          key={c}
          className={`char ${ready(c) ? 'ready' : 'locked'} ${selected === c ? 'on' : ''}`}
          onClick={() => {
            setSelected(c)
            const w = wordsWith(c)[0]
            if (w) hear(w)
          }}
        >
          {c}
        </button>
      ))}
    </div>
  )

  const sel = selected && FAMILIES.find((f) => f.chars.includes(selected))
  const readable = STORIES.filter((s) => completed[s.id])

  return (
    <div>
      <p className="hint">
        <b>{readyCount}</b> / {ALL_CHARS.length} characters ready — a character lights up once you've heard a word with it
        {' '}{STICKY}×. Tap any character to hear it and see its word family.
      </p>

      {selected && (
        <div className="char-detail">
          <div className="big-char">{selected}</div>
          <div>
            <div className="pinyin big-pinyin">{charPinyin(selected)}</div>
            {sel && <p className="hint">{sel.emoji} {sel.comp} = {sel.meaning}</p>}
            {PICTOGRAPHS.includes(selected) && <p className="hint">🖼️ Started as a picture of the thing.</p>}
            <div className="progress-list">
              {wordsWith(selected).map((w) => (
                <button key={w.id} className="chip" onClick={() => hear(w)}>
                  {w.emoji} {w.hanzi} <span className="pinyin">{w.pinyin}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <section>
        <h3>📖 Read a story you know</h3>
        {readable.length ? (
          <div className="progress-list">
            {readable.map((s) => (
              <button key={s.id} className="chip" onClick={() => setReading(s)}>{s.cover} {s.title}</button>
            ))}
          </div>
        ) : (
          <p className="hint">Finish a story by listening first — then read it here.</p>
        )}
      </section>

      <section>
        <h3>🖼️ Pictures <span className="pinyin">— characters that began as drawings</span></h3>
        {tiles(PICTOGRAPHS)}
      </section>
      {FAMILIES.map((f) => (
        <section key={f.comp}>
          <h3>{f.emoji} <span className="comp">{f.comp}</span> <span className="pinyin">{f.meaning}</span></h3>
          {tiles(f.chars)}
        </section>
      ))}
      <section>
        <h3>✳️ Others</h3>
        {tiles(other)}
      </section>
    </div>
  )
}

/** A story as text: tap any word to hear it and see its pinyin; pictures only on request. */
function ReadStory({ story, say, onHeardText, onBack }: { story: Story; say: Say; onHeardText: (t: string) => void; onBack: () => void }) {
  const [info, setInfo] = useState<Word | null>(null)
  const [shown, setShown] = useState<number[]>([])
  const speak = (text: string) => {
    onHeardText(text)
    say(text)
  }

  return (
    <div>
      <div className="story-head">
        <button className="secondary" onClick={onBack}>←</button>
        <span className="hanzi">{story.title}</span>
      </div>
      <div className="read-info">
        {info ? (
          <>
            {info.emoji} <b className="hanzi">{info.hanzi}</b> <span className="pinyin">{info.pinyin}</span>
          </>
        ) : (
          <span className="hint">Tap a word you can't read.</span>
        )}
      </div>
      {story.lines.map((l, i) => (
        <div key={i} className="read-line">
          <p className="read-text">
            {tokenize(l.zh).map((t, k) =>
              t.word ? (
                <button key={k} className="rw" onClick={() => { setInfo(t.word!); speak(t.word!.hanzi) }}>{t.text}</button>
              ) : (
                <span key={k}>{t.text}</span>
              ),
            )}
          </p>
          <div className="read-actions">
            <button className="secondary" onClick={() => speak(l.zh)} aria-label="Read line aloud">🔊</button>
            <button className="secondary" onClick={() => setShown(shown.includes(i) ? shown.filter((x) => x !== i) : [...shown, i])} aria-label="Show picture">🖼️</button>
          </div>
          {shown.includes(i) && <Pic pic={l.pic} className="read-pic" />}
        </div>
      ))}
    </div>
  )
}
