import { useEffect, useRef, useState } from 'react'
import { pitchTrack } from './pitch'
import { ToneChart } from './ToneChart'

type Props = { text: string; say: (text: string) => Promise<void> }

/**
 * Repeat-after-me (opt-in, like a toddler imitating): record yourself, then compare with the model.
 * Nothing is scored or uploaded — the recording only lives in this page.
 * Parent should key this by line so each line starts fresh.
 */
export function Echo({ text, say }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'ready' | 'error'>('idle')
  const [url, setUrl] = useState<string | null>(null)
  const [track, setTrack] = useState<(number | null)[] | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)

  useEffect(
    () => () => {
      if (recorder.current?.state === 'recording') recorder.current.stop()
    },
    [],
  )
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])

  async function record() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream)
      const chunks: Blob[] = []
      r.ondataavailable = (e) => chunks.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: r.mimeType })
        setUrl(URL.createObjectURL(blob))
        setState('ready')
        setTrack(null)
        pitchTrack(blob).then(setTrack, () => setTrack(null))
      }
      r.start()
      recorder.current = r
      setState('recording')
      setTimeout(() => r.state === 'recording' && r.stop(), 8000)
    } catch {
      setState('error')
    }
  }

  if (state === 'error') return <p className="hint">Microphone not available.</p>

  return (
    <>
    <div className="echo">
      {state === 'recording' ? (
        <button className="secondary rec" onClick={() => recorder.current?.stop()}>⏹ Stop</button>
      ) : (
        <button className="secondary" onClick={record} title="Repeat after me: record yourself">
          🎙️ {state === 'ready' ? 'Again' : 'Echo'}
        </button>
      )}
      {state === 'ready' && url && (
        <>
          <button className="secondary" onClick={() => say(text)}>🔊 Model</button>
          <button className="secondary" onClick={() => new Audio(url).play()}>▶ Me</button>
        </>
      )}
    </div>
    {state === 'ready' && track && <ToneChart text={text} track={track} />}
    </>
  )
}
