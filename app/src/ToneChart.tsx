import { marked, sentenceSyllables, type Syllable } from './data/pinyin'

/** Textbook tone shapes on the 1–5 (low–high) pitch scale. A non-final 3rd tone is a "half third" (low dip). */
function shape(s: Syllable, last: boolean): number[] {
  switch (s.tone) {
    case 1: return [5, 5]
    case 2: return [3, 5]
    case 3: return last ? [2, 1, 4] : [2, 1, 1]
    case 4: return [5, 1]
    default: return [3, 3]
  }
}

const W = 320
const H = 110
const PAD = 8
const y = (level: number) => PAD + ((5.5 - level) / 5) * (H - 2 * PAD - 16)

/**
 * Grey: expected tone shapes for the line. Accent: your recorded pitch, scaled to your own range.
 * Timing isn't aligned syllable-by-syllable, so this is a rough visual guide, not a score.
 */
export function ToneChart({ text, track }: { text: string; track: (number | null)[] }) {
  const syl = sentenceSyllables(text).filter((s): s is Syllable => s !== null)
  const widths = syl.map((s) => (s.tone === 0 ? 0.5 : 1))
  const unit = (W - 2 * PAD) / widths.reduce((a, b) => a + b, 0)

  const expected = syl.map((s, i) => {
    const x0 = PAD + widths.slice(0, i).reduce((a, b) => a + b, 0) * unit
    const w = widths[i] * unit
    const pts = shape(s, i === syl.length - 1)
    const line = pts.map((lv, k) => `${x0 + 4 + ((w - 8) * k) / (pts.length - 1)},${y(lv)}`).join(' ')
    return { line, label: { x: x0 + w / 2, text: marked(s) } }
  })

  // Your pitch: semitones relative to your own range (10th–90th percentile → levels 1–5).
  const first = track.findIndex((v) => v !== null)
  const last = track.length - 1 - [...track].reverse().findIndex((v) => v !== null)
  const voiced = first < 0 ? [] : track.slice(first, last + 1)
  const st = voiced.map((f) => (f === null ? null : 12 * Math.log2(f)))
  const sorted = st.filter((v): v is number => v !== null).sort((a, b) => a - b)
  const lo = sorted[Math.floor(sorted.length * 0.1)] ?? 0
  const hi = sorted[Math.floor(sorted.length * 0.9)] ?? 1
  const level = (v: number) => Math.min(5.5, Math.max(0.5, 1 + (4 * (v - lo)) / Math.max(hi - lo, 2)))
  const segments: string[] = []
  let cur: string[] = []
  st.forEach((v, i) => {
    if (v === null) {
      if (cur.length > 1) segments.push(cur.join(' '))
      cur = []
    } else cur.push(`${PAD + ((W - 2 * PAD) * i) / Math.max(1, st.length - 1)},${y(level(v))}`)
  })
  if (cur.length > 1) segments.push(cur.join(' '))

  return (
    <figure className="tone-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Your pitch compared with expected tone shapes">
        {expected.map((e, i) => (
          <g key={i}>
            <polyline points={e.line} className="expected" />
            <text x={e.label.x} y={H - 4} textAnchor="middle">{e.label.text}</text>
          </g>
        ))}
        {segments.map((p, i) => <polyline key={i} points={p} className="yours" />)}
      </svg>
      <figcaption>
        Grey: tone shapes · <span className="yours-key">red: you</span>
        {segments.length === 0 && ' (no voice detected — try again closer to the mic)'}
      </figcaption>
    </figure>
  )
}
