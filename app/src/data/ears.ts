// Ear training: adult English speakers don't hear Mandarin tones or some consonant contrasts
// by default (perceptual narrowing). Short, varied-voice listening practice retrains this.

export type EarItem = { hanzi: string; pinyin: string }

/** Same syllable in tones 1–4, as single characters the voice reads unambiguously. */
export const TONE_SETS: EarItem[][] = [
  ['妈 mā', '麻 má', '马 mǎ', '骂 mà'],
  ['八 bā', '拔 bá', '把 bǎ', '爸 bà'],
  ['汤 tāng', '糖 táng', '躺 tǎng', '烫 tàng'],
  ['通 tōng', '同 tóng', '桶 tǒng', '痛 tòng'],
  ['衣 yī', '姨 yí', '椅 yǐ', '意 yì'],
  ['诗 shī', '十 shí', '使 shǐ', '是 shì'],
  ['夫 fū', '福 fú', '府 fǔ', '父 fù'],
].map((set) => set.map((s) => ({ hanzi: s.split(' ')[0], pinyin: s.split(' ')[1] })))

/** Pairs of sounds English ears tend to merge. */
export const SOUND_PAIRS: [EarItem, EarItem][] = [
  ['七 qī', '西 xī'], ['鸡 jī', '知 zhī'], ['吃 chī', '七 qī'], ['菜 cài', '在 zài'],
  ['早 zǎo', '草 cǎo'], ['四 sì', '是 shì'], ['猪 zhū', '书 shū'], ['去 qù', '句 jù'],
  ['女 nǚ', '努 nǔ'], ['绿 lǜ', '路 lù'], ['山 shān', '伤 shāng'], ['心 xīn', '星 xīng'], ['热 rè', '乐 lè'],
].map(([a, b]) => [a, b].map((s) => ({ hanzi: s.split(' ')[0], pinyin: s.split(' ')[1] })) as [EarItem, EarItem])

/** Tone contour glyphs for the answer buttons. */
export const TONE_MARKS = ['ˉ', 'ˊ', 'ˇ', 'ˋ']

/** Progress ids: per tone ("ear:t3") and per pair ("ear:q-x"). */
export const toneId = (tone: number) => `ear:t${tone}`
const initial = (p: string) => p.match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?/)![0] || p.replace(/[^a-zü]/g, '')
export const pairId = ([a, b]: [EarItem, EarItem]) => {
  const [x, y] = [initial(a.pinyin), initial(b.pinyin)]
  return x !== y ? `ear:${x}-${y}` : `ear:${a.pinyin}-${b.pinyin}`
}
