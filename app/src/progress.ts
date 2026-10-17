// Per-word learner model, persisted in localStorage.

export type WordStats = { heard: number; correct: number; wrong: number; streak: number }
export type Progress = Record<string, WordStats>

const KEY = 'learnchinese.progress.v1'
const STORIES_KEY = 'learnchinese.stories.v1'
const TIME_KEY = 'learnchinese.listening.v1'
/** Correct first-try answers in a row before a word counts as known. */
export const KNOWN_STREAK = 3

function load<T>(key: string): T | Record<string, never> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}')
  } catch {
    return {}
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — progress just won't persist */
  }
}

export const loadProgress = (): Progress => load<Progress>(KEY)
export const saveProgress = (p: Progress) => save(KEY, p)

/** Times each story has been completed (listened + answered all questions). */
export type StoriesDone = Record<string, number>
export const loadStoriesDone = (): StoriesDone => load<StoriesDone>(STORIES_KEY)
export const saveStoriesDone = (s: StoriesDone) => save(STORIES_KEY, s)

/** Seconds of Chinese audio heard, per local date (YYYY-MM-DD). */
export type ListeningLog = Record<string, number>
export const loadListening = (): ListeningLog => load<ListeningLog>(TIME_KEY)
export const saveListening = (l: ListeningLog) => save(TIME_KEY, l)
export const today = () => new Date().toLocaleDateString('en-CA')

export function formatMinutes(seconds: number) {
  const m = Math.round(seconds / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`
}

export const statsFor = (p: Progress, id: string): WordStats =>
  p[id] ?? { heard: 0, correct: 0, wrong: 0, streak: 0 }

export const isKnown = (p: Progress, id: string) => statsFor(p, id).streak >= KNOWN_STREAK

export function heard(p: Progress, id: string): Progress {
  const s = statsFor(p, id)
  return { ...p, [id]: { ...s, heard: s.heard + 1 } }
}

export function answered(p: Progress, id: string, firstTry: boolean): Progress {
  const s = statsFor(p, id)
  return {
    ...p,
    [id]: firstTry
      ? { ...s, correct: s.correct + 1, streak: s.streak + 1 }
      : { ...s, wrong: s.wrong + 1, streak: 0 },
  }
}
