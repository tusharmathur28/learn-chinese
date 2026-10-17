import { STORIES, type Question, type Story } from './data/stories'
import { tokenize } from './data/tokenize'
import { STICKY, statsFor, type Progress, type StoriesDone } from './progress'
import { generateStory } from './data/generate'

/** Distinct words in a story you haven't heard enough yet. */
export function weakWords(story: Story, progress: Progress): number {
  const ids = new Set(story.lines.flatMap((l) => tokenize(l.zh).flatMap((t) => (t.word ? [t.word.id] : []))))
  return [...ids].filter((id) => statsFor(progress, id).heard < STICKY).length
}

/**
 * Like a child asking for the same book again: alternate between re-hearing the finished story
 * with the most not-yet-sticky words, and moving on to the next new story.
 */
export function recommendStory(progress: Progress, done: StoriesDone): Story {
  const firstNew = STORIES.find((s) => !done[s.id])
  const review = STORIES.filter((s) => done[s.id] && weakWords(s, progress) > 0).sort(
    (a, b) => weakWords(b, progress) - weakWords(a, progress),
  )[0]
  const total = Object.values(done).reduce((n, x) => n + x, 0)
  if (review && (!firstNew || total % 2 === 1)) return review
  // All hand-written stories heard: fresh generated mini-stories from here on.
  return firstNew ?? generateStory(progress)
}

const SWAP: Record<string, string> = {
  小明: '小红', 小红: '小明', 妈妈: '爸爸', 爸爸: '妈妈', '👦': '👧', '👧': '👦', '👩': '👨', '👨': '👩',
}
const swap = (s: string) => s.replace(/小明|小红|妈妈|爸爸|👦|👧|👩|👨/gu, (m) => SWAP[m])

/** Same story, cast swapped (小明↔小红, 妈妈↔爸爸) so a re-listen isn't word-for-word identical. */
export function retold(story: Story): Story {
  const swapQ = (q: Question): Question => ({
    ...q,
    q: swap(q.q),
    pic: q.pic && swap(q.pic),
    options: q.options.map((o) => ({ ...o, pic: swap(o.pic) })),
  })
  return {
    ...story,
    title: swap(story.title),
    lines: story.lines.map((l) => ({ zh: swap(l.zh), pic: swap(l.pic), ask: l.ask?.map(swapQ) })),
    questions: story.questions.map(swapQ),
  }
}

/** Every second listen of a story is the retold version. */
export const versionFor = (story: Story, done: StoriesDone) => ((done[story.id] ?? 0) % 2 === 1 ? retold(story) : story)

/**
 * iOS Safari only allows speech started synchronously inside a tap handler, so whoever opens
 * a story calls this from the click, and the player itself doesn't autoplay on mount.
 */
export function speakFirstLine(story: Story, { say, onHeardText }: { say: (text: string) => unknown; onHeardText: (text: string) => void }) {
  onHeardText(story.lines[0].zh)
  say(story.lines[0].zh)
}
