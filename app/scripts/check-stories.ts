// Content checks for stories: run with `npm run check:stories`.
// 1. Every sentence uses only vocabulary words (so pinyin + exposure tracking work).
// 2. Every story word is encountered at least MIN_ENCOUNTERS times across all stories.
// 3. Question answers point at a real option.
import { STORIES } from '../src/data/stories.ts'
import { tokenize } from '../src/data/tokenize.ts'
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

const lines = STORIES.reduce((n, s) => n + s.lines.length, 0)
console.log(`${STORIES.length} stories, ${lines} lines, ${counts.size} distinct words used`)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('All checks passed.')
