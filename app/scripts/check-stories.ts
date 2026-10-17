// Content checks for stories: run with `npm run check:stories`.
// 1. Every sentence uses only vocabulary words (so pinyin + exposure tracking work).
// 2. Every story word is encountered at least MIN_ENCOUNTERS times across all stories.
// 3. Question answers point at a real option.
// 4. Every vocabulary word's pinyin splits into one syllable per character.
import { STORIES } from '../src/data/stories.ts'
import { tokenize, VOCAB } from '../src/data/tokenize.ts'
import { syllables } from '../src/data/pinyin.ts'
import { generateStory } from '../src/data/generate.ts'
import { ALL_CHARS, FAMILIES, PICTOGRAPHS } from '../src/data/hanzi.ts'
import { STORY_WORDS } from '../src/data/words.ts'

const MIN_ENCOUNTERS = 10
const errors: string[] = []
const counts = new Map<string, number>()

for (const s of STORIES) {
  const questions = [...s.questions, ...s.lines.flatMap((l) => l.ask ?? [])]
  const texts = [...s.lines.map((l) => l.zh), ...questions.map((q) => q.q), ...questions.flatMap((q) => q.options.map((o) => o.say ?? ''))]
  for (const text of texts) {
    for (const t of tokenize(text)) {
      if (t.unknown) errors.push(`[${s.id}] unknown "${t.text}" in: ${text}`)
      if (t.word) counts.set(t.word.id, (counts.get(t.word.id) ?? 0) + 1)
    }
  }
  questions.forEach((q, i) => {
    if (q.answer < 0 || q.answer >= q.options.length) errors.push(`[${s.id}] question ${i + 1} answer out of range`)
  })
}

for (const w of STORY_WORDS) {
  const n = counts.get(w.id) ?? 0
  if (n < MIN_ENCOUNTERS) errors.push(`"${w.hanzi}" only appears ${n}× (need ${MIN_ENCOUNTERS})`)
}

// 5. Generated mini-stories only use vocabulary and have valid answers (sampled).
const seen = new Set<string>()
for (let i = 0; i < 500; i++) {
  const s = generateStory({})
  for (const q of [...s.questions, ...s.lines.flatMap((l) => l.ask ?? [])]) {
    if (q.answer < 0 || q.answer >= q.options.length) errors.push(`[generated] answer out of range: ${q.q}`)
    if (new Set(q.options.map((o) => o.pic)).size !== q.options.length) errors.push(`[generated] duplicate options: ${q.q}`)
    for (const t of tokenize(q.q)) if (t.unknown && !seen.has(q.q)) errors.push(`[generated] unknown "${t.text}" in: ${q.q}`)
    seen.add(q.q)
  }
  for (const l of s.lines) {
    for (const t of tokenize(l.zh)) if (t.unknown && !seen.has(l.zh)) errors.push(`[generated] unknown "${t.text}" in: ${l.zh}`)
    seen.add(l.zh)
  }
}

for (const w of VOCAB) {
  try {
    syllables(w.hanzi, w.pinyin)
  } catch (e) {
    errors.push((e as Error).message)
  }
}

// 6. Reading families only list characters that are in the vocabulary.
for (const ch of PICTOGRAPHS + FAMILIES.map((f) => f.chars).join('')) {
  if (!ALL_CHARS.includes(ch)) errors.push(`character ${ch} in Read families is not in any vocabulary word`)
}

const lines = STORIES.reduce((n, s) => n + s.lines.length, 0)
console.log(`${STORIES.length} stories, ${lines} lines, ${counts.size} distinct words used`)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('All checks passed.')
