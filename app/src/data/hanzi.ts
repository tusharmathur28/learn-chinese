// Character families for reading: most characters combine a meaning component (radical) with
// a sound or shape part. Grouping by component lets adults learn characters by pattern, not rote.
import { marked, syllables } from './pinyin.ts'
import { VOCAB } from './tokenize.ts'
import type { Word } from './words.ts'

export type Family = { comp: string; meaning: string; emoji: string; chars: string }

/** Characters that started as drawings of the thing. */
export const PICTOGRAPHS = '山火水雨月云马鱼鸟门车手米竹羊牛象耳子大小一两三'

export const FAMILIES: Family[] = [
  { comp: '艹', meaning: 'grass, plants', emoji: '🌱', chars: '苹蕉葡萄草莓茶萝花' },
  { comp: '木', meaning: 'tree, wood', emoji: '🌳', chars: '树椅橙机床果' },
  { comp: '口', meaning: 'mouth', emoji: '👄', chars: '吃喝嘴吗哪' },
  { comp: '犭', meaning: 'animal (dog)', emoji: '🐾', chars: '狗猫猪猴' },
  { comp: '鸟', meaning: 'bird', emoji: '🐦', chars: '鸟鸡鸭' },
  { comp: '饣', meaning: 'food', emoji: '🍚', chars: '饭饺' },
  { comp: '米', meaning: 'rice, grain', emoji: '🌾', chars: '米糕' },
  { comp: '扌', meaning: 'hand', emoji: '✋', chars: '把拍挥摸' },
  { comp: '⻊', meaning: 'foot', emoji: '🦶', chars: '跳跑' },
  { comp: '目', meaning: 'eye', emoji: '👁️', chars: '眼睛看睡' },
  { comp: '自', meaning: 'nose (a drawing of one)', emoji: '👃', chars: '自鼻' },
  { comp: '氵', meaning: 'water', emoji: '💧', chars: '水淇没' },
  { comp: '雨', meaning: 'rain, weather', emoji: '🌧️', chars: '雨雪' },
  { comp: '日', meaning: 'sun, day', emoji: '☀️', chars: '明星阳' },
  { comp: '月', meaning: 'moon (also “flesh” in body words)', emoji: '🌙', chars: '月有脑脚服' },
  { comp: '火 / 灬', meaning: 'fire', emoji: '🔥', chars: '火熊' },
  { comp: '讠', meaning: 'speech', emoji: '💬', chars: '谁说' },
  { comp: '心', meaning: 'heart, feeling', emoji: '❤️', chars: '想' },
  { comp: '纟', meaning: 'silk, thread', emoji: '🧵', chars: '红给' },
  { comp: '钅', meaning: 'metal', emoji: '🔩', chars: '钥钟镜' },
  { comp: '车', meaning: 'vehicle, wheel', emoji: '🚗', chars: '车转' },
  { comp: '门', meaning: 'door', emoji: '🚪', chars: '门闹' },
  { comp: '⺮', meaning: 'bamboo', emoji: '🎋', chars: '竹笑' },
  { comp: '亻', meaning: 'person', emoji: '🧑', chars: '你什' },
  { comp: '女 / 父', meaning: 'woman / father', emoji: '👪', chars: '妈爸' },
  { comp: '辶', meaning: 'walking, movement', emoji: '🚶', chars: '这还' },
  { comp: '大', meaning: 'big (a person with arms out)', emoji: '🙆', chars: '大太天' },
  { comp: '宀 / 户', meaning: 'roof / door — buildings', emoji: '🏠', chars: '家房' },
]

/** Vocab words containing the character (the word family: 车 → 车, 自行车). */
export const wordsWith = (ch: string): Word[] => VOCAB.filter((w) => w.hanzi.includes(ch))

/** Reading of a character, taken from the first word that contains it. */
export function charPinyin(ch: string): string {
  const w = wordsWith(ch)[0]
  if (!w) return ''
  const s = syllables(w.hanzi, w.pinyin).find((x) => x.hanzi === ch)
  return s ? marked(s) : ''
}

/** Every character in the vocabulary, in first-seen order. */
export const ALL_CHARS = [...new Set(VOCAB.flatMap((w) => [...w.hanzi]))]
