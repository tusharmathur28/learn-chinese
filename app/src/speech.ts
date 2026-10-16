// Mandarin text-to-speech using the browser's built-in voices (free, no API).

let voice: SpeechSynthesisVoice | null = null

function pickVoice(): SpeechSynthesisVoice | null {
  const zh = speechSynthesis
    .getVoices()
    .filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('zh-cn'))
  // Prefer neural voices (e.g. Edge's "Microsoft Xiaoxiao Online (Natural)").
  return zh.find((v) => /natural|online|xiaoxiao/i.test(v.name)) ?? zh[0] ?? null
}

/** Resolves once voices are loaded; returns whether a Chinese voice exists. */
export function initVoices(): Promise<boolean> {
  return new Promise((resolve) => {
    const done = () => {
      voice = pickVoice()
      resolve(voice !== null)
    }
    if (speechSynthesis.getVoices().length) return done()
    speechSynthesis.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 2000) // some browsers never fire voiceschanged
  })
}

/** Speaks text, cancelling anything already playing. Resolves when finished. */
export function speak(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    if (voice) u.voice = voice
    u.rate = rate
    // onend is unreliable in some browsers; fall back to a generous timeout.
    const fallback = setTimeout(resolve, 1500 + (text.length * 600) / rate)
    u.onend = u.onerror = () => {
      clearTimeout(fallback)
      resolve()
    }
    speechSynthesis.speak(u)
  })
}
