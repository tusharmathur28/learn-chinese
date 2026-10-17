// Pinyin syllables, tone sandhi, and tone-marked display.
import { tokenize } from './tokenize.ts'

/** A syllable without tone marks, its tone (1–4, 0 = neutral) and the character it belongs to. */
export type Syllable = { plain: string; tone: number; hanzi: string }

const MARKS: Record<string, [string, number]> = {}
for (const [base, forms] of [['a', 'āáǎà'], ['e', 'ēéěè'], ['i', 'īíǐì'], ['o', 'ōóǒò'], ['u', 'ūúǔù'], ['ü', 'ǖǘǚǜ']] as const) {
  ;[...forms].forEach((m, i) => (MARKS[m] = [base, i + 1]))
}

const INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w', '']
const FINALS = [
  'iang', 'iong', 'uang', 'ang', 'eng', 'ing', 'ong', 'ian', 'iao', 'uai', 'uan', 'üan', 'ai', 'ei', 'ao', 'ou',
  'an', 'en', 'in', 'un', 'ün', 'ia', 'ie', 'iu', 'ua', 'uo', 'ui', 'üe', 'ue', 'er', 'a', 'o', 'e', 'i', 'u', 'ü',
]

/** All ways to split `s` into exactly `n` syllables, each as [start, end]. */
function splits(s: string, n: number, from = 0): [number, number][][] {
  if (n === 0) return from === s.length ? [[]] : []
  const out: [number, number][][] = []
  for (const ini of INITIALS) {
    if (!s.startsWith(ini, from)) continue
    for (const fin of FINALS) {
      const end = from + ini.length + fin.length
      if (s.startsWith(fin, from + ini.length)) for (const rest of splits(s, n - 1, end)) out.push([[from, end], ...rest])
    }
  }
  return out
}

/** Split one word's pinyin (e.g. "dàngāo") into its syllables, one per character. */
export function syllables(hanzi: string, pinyin: string): Syllable[] {
  const er = hanzi.endsWith('儿') && hanzi.length > 1 // erhua: 哪儿 = one syllable "nǎr"
  const chars = [...(er ? hanzi.slice(0, -1) : hanzi)]
  let plain = ''
  const tones: number[] = []
  for (const ch of pinyin.toLowerCase().replace(/v/g, 'ü')) {
    const m = MARKS[ch]
    plain += m ? m[0] : ch
    tones.push(m ? m[1] : 0)
  }
  const body = er ? plain.slice(0, -1) : plain
  // Prefer splits where later syllables start with a consonant (dàn-gāo, not dàng-āo).
  const best = splits(body, chars.length).sort(
    (a, b) => b.filter(([s], i) => i > 0 && /[^aeiouü]/.test(body[s])).length - a.filter(([s], i) => i > 0 && /[^aeiouü]/.test(body[s])).length,
  )[0]
  if (!best) throw new Error(`Can't split pinyin "${pinyin}" for ${hanzi}`)
  return best.map(([s, e], i) => ({
    plain: body.slice(s, e) + (er && i === best.length - 1 ? 'r' : ''),
    tone: Math.max(0, ...tones.slice(s, e)),
    hanzi: chars[i],
  }))
}

/**
 * Spoken tones: 3+3 → 2+3; 不 → bú before tone 4; 一 → yí before tone 4, yì before 1/2/3.
 * `null` entries are punctuation (they break tone runs).
 */
export function applySandhi(seq: (Syllable | null)[]): (Syllable | null)[] {
  const out = seq.map((s) => (s ? { ...s } : null))
  for (let i = 0; i < out.length; i++) {
    const s = out[i]
    const next = out[i + 1]
    if (!s || !next) continue
    if (s.hanzi === '不' && next.tone === 4) s.tone = 2
    else if (s.hanzi === '一' && s.plain === 'yi' && next.tone > 0) s.tone = next.tone === 4 ? 2 : 4
  }
  // Third tone before a (still) third tone becomes second, working right to left:
  // 你好 → ní hǎo, 很小 → hén xiǎo, 小狗很小 → xiáo gǒu hén xiǎo.
  for (let i = out.length - 2; i >= 0; i--) {
    if (seq[i]?.tone === 3 && out[i + 1]?.tone === 3) out[i]!.tone = 2
  }
  return out
}

/** Syllables of a sentence (vocab words only), with sandhi applied. */
export function sentenceSyllables(text: string): (Syllable | null)[] {
  return applySandhi(tokenize(text).flatMap((t) => (t.word ? syllables(t.word.hanzi, t.word.pinyin) : t.unknown ? [] : [null])))
}

/** Put the tone mark on the right vowel: a/e first, then the o of "ou", else the last vowel. */
export function marked({ plain, tone }: Syllable): string {
  if (!tone) return plain
  const i = /[ae]/.test(plain) ? plain.search(/[ae]/) : plain.includes('ou') ? plain.indexOf('o') : Math.max(...[...'iouü'].map((v) => plain.lastIndexOf(v)))
  const v = plain[i]
  const m = Object.entries(MARKS).find(([, [b, t]]) => b === v && t === tone)![0]
  return plain.slice(0, i) + m + plain.slice(i + 1)
}

/** Pinyin for a sentence as spoken (with sandhi), words separated by spaces. */
export function toPinyin(text: string): string {
  const syl = sentenceSyllables(text)
  let k = 0
  return tokenize(text)
    .map((t) => {
      if (!t.word) return t.unknown ? t.text : (k++, t.text)
      const n = syllables(t.word.hanzi, t.word.pinyin).length
      const s = syl.slice(k, k + n).map((x) => marked(x!)).join('')
      k += n
      const proper = t.word.pinyin[0] !== t.word.pinyin[0].toLowerCase() // names like Xiǎomíng
      return ' ' + (proper ? s[0].toUpperCase() + s.slice(1) : s)
    })
    .join('')
    .trim()
}
