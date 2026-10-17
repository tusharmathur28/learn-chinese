// Mandarin text-to-speech using the browser's built-in voices (free, no API).

let voices: SpeechSynthesisVoice[] = []
let narrator: SpeechSynthesisVoice | null = null
let onListened: ((ms: number) => void) | null = null

function loadVoices() {
  const zh = speechSynthesis
    .getVoices()
    .filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('zh-cn'))
  // Prefer neural voices (e.g. Edge's "Microsoft Xiaoxiao Online (Natural)") and don't mix them with robotic ones.
  const natural = zh.filter((v) => /natural|online|neural/i.test(v.name))
  voices = natural.length ? natural : zh
  narrator = voices.find((v) => /xiaoxiao/i.test(v.name)) ?? voices[0] ?? null
}

/** Resolves once voices are loaded; returns whether a Chinese voice exists. */
export function initVoices(): Promise<boolean> {
  return new Promise((resolve) => {
    const done = () => {
      loadVoices()
      resolve(narrator !== null)
    }
    if (speechSynthesis.getVoices().length) return done()
    speechSynthesis.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 2000) // some browsers never fire voiceschanged
  })
}

/** Called with the duration of every utterance that actually played (for listening-time tracking). */
export function setListenHandler(fn: (ms: number) => void) {
  onListened = fn
}

export type SpeakOptions = {
  /** Use a random voice — hearing many speakers helps you recognise words (and tones) in anyone's voice. */
  vary?: boolean
  /** Called with the character index of the word being spoken. */
  onWord?: (charIndex: number) => void
}

/** Speaks text, cancelling anything already playing. Resolves when finished. */
export function speak(text: string, rate: number, opts: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    const v = opts.vary && voices.length > 1 ? voices[Math.floor(Math.random() * voices.length)] : narrator
    if (v) u.voice = v
    u.rate = rate

    let started = 0
    let sim: ReturnType<typeof setInterval> | undefined
    if (opts.onWord) {
      const onWord = opts.onWord
      u.onboundary = (e) => {
        clearInterval(sim) // real word boundaries available: stop simulating
        onWord(e.charIndex)
      }
    }
    u.onstart = () => {
      started = performance.now()
      if (!opts.onWord) return
      // Not every engine reports word boundaries; step through the text at an estimated pace until one arrives.
      let i = 0
      const onWord = opts.onWord
      sim = setInterval(() => (i < text.length ? onWord(i++) : clearInterval(sim)), 260 / rate)
    }

    const finish = () => {
      clearInterval(sim)
      clearTimeout(fallback)
      if (started) onListened?.(performance.now() - started)
      resolve()
    }
    // onend is unreliable in some browsers; fall back to a generous timeout.
    const fallback = setTimeout(() => {
      started = 0
      finish()
    }, 1500 + (text.length * 600) / rate)
    u.onend = u.onerror = finish
    speechSynthesis.speak(u)
  })
}
