import { SCENES, type Word } from './words.ts'

/** Action verbs, learned TPR-style: watch it done, then pick who's doing it. `anim` is a CSS animation class. */
export type Action = Word & { anim: string }

const a = (hanzi: string, pinyin: string, emoji: string, anim: string): Action => ({ id: hanzi, hanzi, pinyin, emoji, anim })

export const ACTIONS: Action[] = [
  a('跳', 'tiào', '🧒', 'jump'), a('跑', 'pǎo', '🏃', 'run'), a('转圈', 'zhuànquān', '🧒', 'spin'),
  a('睡觉', 'shuìjiào', '😴', 'sleep'), a('笑', 'xiào', '😄', 'laugh'), a('哭', 'kū', '😭', 'cry'),
  a('拍手', 'pāishǒu', '👏', 'clap'), a('挥手', 'huīshǒu', '👋', 'wave'),
]

/** Body parts you "touch" (摸) in the Do-it game. */
export const BODY_PARTS: Word[] = SCENES.find((s) => s.id === 'body')!.words

/** People you can give things to in the Give game. */
export const PEOPLE = ['小明', '小红', '妈妈', '爸爸']

/** Grammar/verbs used by the games (not by stories). */
export const GAME_WORDS: Word[] = [
  { id: '摸', hanzi: '摸', pinyin: 'mō', emoji: '👆' },
  { id: '把', hanzi: '把', pinyin: 'bǎ', emoji: '' },
  ...ACTIONS,
]
