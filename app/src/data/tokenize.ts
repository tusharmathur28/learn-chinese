import { ALL_WORDS, STORY_WORDS, type Word } from './words.ts'
import { GAME_WORDS } from './actions.ts'

export const VOCAB: Word[] = [...ALL_WORDS, ...STORY_WORDS, ...GAME_WORDS]
const BY_HANZI = new Map(VOCAB.map((w) => [w.hanzi, w]))
const MAX_LEN = Math.max(...VOCAB.map((w) => w.hanzi.length))
const PUNCT = /[，。？！、\s]/

/** A piece of text: a vocab word, punctuation, or (if content is broken) an unknown character. */
export type Token = { text: string; word?: Word; unknown?: boolean }

/** Greedy longest-match segmentation against the app's vocabulary. */
export function tokenize(text: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < text.length) {
    let match: Word | undefined
    for (let len = Math.min(MAX_LEN, text.length - i); len > 0 && !match; len--) {
      match = BY_HANZI.get(text.slice(i, i + len))
    }
    if (match) {
      out.push({ text: match.hanzi, word: match })
      i += match.hanzi.length
    } else {
      out.push({ text: text[i], unknown: !PUNCT.test(text[i]) })
      i++
    }
  }
  return out
}
