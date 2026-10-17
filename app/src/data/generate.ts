// Template-based mini-story generator: endless comprehensible input from known vocabulary,
// favouring words you haven't heard enough yet. Validated by `npm run check:stories`.
import { STICKY, statsFor, type Progress } from '../progress.ts'
import type { Line, Option, Question, Story } from './stories.ts'
import { SCENES, STORY_WORDS, type Word } from './words.ts'

const byId = (ids: string[]) => ids.map((id) => [...SCENES.flatMap((s) => s.words), ...STORY_WORDS].find((w) => w.id === id)!)

const PEOPLE = byId(['小明', '小红', '妈妈', '爸爸'])
const FOODS = byId(['苹果', '香蕉', '西瓜', '葡萄', '橙子', '草莓', '面包', '鸡蛋', '米饭', '面条', '饺子', '蛋糕', '冰淇淋', '胡萝卜'])
/** Foods that are naturally counted with 个. */
const COUNTABLE = byId(['苹果', '香蕉', '橙子', '鸡蛋', '饺子', '草莓'])
const DRINKS = byId(['牛奶', '茶', '水'])
/** Animals counted with 只. */
const ANIMALS = byId(['狗', '猫', '鸟', '鸡', '兔子', '猴子', '鸭子', '羊', '老虎', '熊猫'])
const OBJECTS = byId(['书', '手机', '电脑', '球', '帽子', '钥匙', '眼镜'])
const PLACES = [
  { zh: '床上', emoji: '🛏️' }, { zh: '椅子上', emoji: '🪑' }, { zh: '家', emoji: '🏠' }, { zh: '车上', emoji: '🚗' },
]
const NUM = ['一', '两', '三']

type Pick = <T extends Word>(pool: T[], not?: Word[]) => T

/** Weighted pick: not-yet-sticky words that you've met are most likely, new words sometimes. */
function picker(progress: Progress): Pick {
  return (pool, not = []) => {
    const options = pool.filter((w) => !not.includes(w))
    const weight = (w: Word) => {
      const h = statsFor(progress, w.id).heard
      return h === 0 ? 1 : h < STICKY ? 4 : 1.5
    }
    let r = Math.random() * options.reduce((n, w) => n + weight(w), 0)
    for (const w of options) if ((r -= weight(w)) <= 0) return w
    return options[options.length - 1]
  }
}

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)
const L = (zh: string, pic: string, ask?: Question[]): Line => ({ zh, pic, ask })
const Q = (q: string, options: Option[], answer: number): Question => ({ q, options, answer })
const yesNo = (): Option[] => [{ pic: '✅', say: '对' }, { pic: '❌', say: '不对' }]
const times = (e: string, n: number) => Array(n).fill(e).join(' ')

/** A question whose options are `choices` (shuffled), with `right` as the answer. */
function choose(q: string, right: string, others: string[]): Question {
  const pics = shuffle([right, ...others])
  return Q(q, pics.map((pic) => ({ pic })), pics.indexOf(right))
}
const counts = (e: string) => [1, 2, 3].map((n) => times(e, n).replace(/ /g, ''))

type Template = (pick: Pick) => { title: string; cover: string; lines: Line[]; questions: Question[] }

const TEMPLATES: Template[] = [
  // Likes and wants: 喜欢吃 / 不喜欢 / 我想吃 / 给
  (pick) => {
    const p1 = pick(PEOPLE), p2 = pick(PEOPLE, [p1])
    const f1 = pick(FOODS), f2 = pick(FOODS, [f1]), f3 = pick(FOODS, [f1, f2])
    return {
      title: `${p1.hanzi}想吃什么`, cover: f1.emoji,
      lines: [
        L(`${p1.hanzi}喜欢吃${f1.hanzi}。`, `${p1.emoji} ❤️ ${f1.emoji}`, [
          Q(`${p1.hanzi}喜欢吃${f2.hanzi}吗？`, yesNo(), 1),
          choose(`${p1.hanzi}喜欢吃${f1.hanzi}还是${f2.hanzi}？`, f1.emoji, [f2.emoji]),
        ]),
        L(`${p1.hanzi}不喜欢吃${f2.hanzi}。`, `${p1.emoji} ❌ ${f2.emoji}`),
        L(`${p2.hanzi}喜欢吃什么？`, `${p2.emoji} ❓`),
        L(`${p2.hanzi}喜欢吃${f2.hanzi}。${p2.hanzi}很喜欢吃${f2.hanzi}！`, `${p2.emoji} ❤️ ${f2.emoji}`, [
          choose(`谁喜欢吃${f2.hanzi}？`, p2.emoji, [p1.emoji]),
        ]),
        L(`${p1.hanzi}说：“我想吃${f1.hanzi}。”`, `${p1.emoji} 💬 ${f1.emoji}`),
        L(`${p2.hanzi}说：“我也想吃${f1.hanzi}！”`, `${p2.emoji} 💬 ${f1.emoji}`),
        L(`${p1.hanzi}给${p2.hanzi}${f1.hanzi}。`, `${p1.emoji} ${f1.emoji} ➡️ ${p2.emoji}`),
      ],
      questions: [
        choose(`${p1.hanzi}想吃什么？`, f1.emoji, [f2.emoji, f3.emoji]),
        choose(`谁不喜欢吃${f2.hanzi}？`, p1.emoji, [p2.emoji]),
      ],
    }
  },
  // Drinks dialogue: 你要喝什么？ / 我要喝… / 给你！
  (pick) => {
    const p1 = pick(PEOPLE), p2 = pick(PEOPLE, [p1])
    const [d1, d2, d3] = shuffle(DRINKS)
    return {
      title: '你要喝什么', cover: d1.emoji,
      lines: [
        L(`${p2.hanzi}说：“${p1.hanzi}，你要喝什么？”`, `${p2.emoji} 💬 ❓`),
        L(`${p1.hanzi}说：“我要喝${d1.hanzi}。”`, `${p1.emoji} 💬 ${d1.emoji}`, [
          Q(`${p1.hanzi}要喝${d2.hanzi}吗？`, yesNo(), 1),
          choose(`${p1.hanzi}要喝${d1.hanzi}还是${d2.hanzi}？`, d1.emoji, [d2.emoji]),
        ]),
        L(`${p1.hanzi}不要喝${d2.hanzi}。${p1.hanzi}要喝${d1.hanzi}。`, `${p1.emoji} ❌ ${d2.emoji} · 🙋 ${d1.emoji}`),
        L(`${p2.hanzi}给${p1.hanzi}${d1.hanzi}。`, `${p2.emoji} ${d1.emoji} ➡️ ${p1.emoji}`),
        L(`${p2.hanzi}说：“给你！”`, `${p2.emoji} 💬 ${d1.emoji}`),
        L(`${p2.hanzi}要喝什么？${p2.hanzi}要喝${d3.hanzi}。`, `${p2.emoji} 🙋 ${d3.emoji}`, [
          choose(`谁要喝${d3.hanzi}？`, p2.emoji, [p1.emoji]),
        ]),
      ],
      questions: [
        choose(`${p1.hanzi}要喝什么？`, d1.emoji, [d2.emoji, d3.emoji]),
        choose(`谁给${p1.hanzi}${d1.hanzi}？`, p2.emoji, shuffle(PEOPLE.filter((p) => p !== p2)).slice(0, 2).map((p) => p.emoji)),
      ],
    }
  },
  // Having and counting: 有几只 / 没有 / 你看！
  (pick) => {
    const p1 = pick(PEOPLE), p2 = pick(PEOPLE, [p1])
    const a1 = pick(ANIMALS), a2 = pick(ANIMALS, [a1])
    const n = 1 + Math.floor(Math.random() * 3), m = 1 + Math.floor(Math.random() * 3)
    return {
      title: `${p1.hanzi}有几只${a1.hanzi}`, cover: a1.emoji,
      lines: [
        L(`${p1.hanzi}有${NUM[n - 1]}只${a1.hanzi}。`, `${p1.emoji} ${times(a1.emoji, n)}`, [
          choose(`${p1.hanzi}有几只${a1.hanzi}？`, counts(a1.emoji)[n - 1], counts(a1.emoji).filter((_, i) => i !== n - 1)),
        ]),
        L(`${p2.hanzi}有${a1.hanzi}吗？没有。${p2.hanzi}没有${a1.hanzi}。`, `${p2.emoji} ❌ ${a1.emoji}`),
        L(`${p2.hanzi}有${NUM[m - 1]}只${a2.hanzi}。`, `${p2.emoji} ${times(a2.emoji, m)}`, [
          Q(`${p2.hanzi}有${a1.hanzi}吗？`, [{ pic: '✅', say: '有' }, { pic: '❌', say: '没有' }], 1),
        ]),
        L(`${p1.hanzi}说：“你看！我有${NUM[n - 1]}只${a1.hanzi}。”`, `${p1.emoji} 💬 ${times(a1.emoji, n)}`),
        L(`${p2.hanzi}说：“我有${NUM[m - 1]}只${a2.hanzi}。”`, `${p2.emoji} 💬 ${times(a2.emoji, m)}`),
        L(`${p1.hanzi}很喜欢${a2.hanzi}。`, `${p1.emoji} ❤️ ${a2.emoji}`),
      ],
      questions: [
        choose(`谁有${a2.hanzi}？`, p2.emoji, [p1.emoji]),
        choose(`${p2.hanzi}有几只${a2.hanzi}？`, counts(a2.emoji)[m - 1], counts(a2.emoji).filter((_, i) => i !== m - 1)),
      ],
    }
  },
  // Where is it: 在哪儿 / 在…上 / 你看！
  (pick) => {
    const p1 = pick(PEOPLE), p2 = pick(PEOPLE, [p1])
    const x = pick(OBJECTS)
    const [here, there] = shuffle(PLACES)
    const at = (pl: typeof here) => (pl.zh === '家' ? '在家' : `在${pl.zh}`)
    return {
      title: `${x.hanzi}在哪儿`, cover: x.emoji,
      lines: [
        L(`${p1.hanzi}的${x.hanzi}在哪儿？`, `${p1.emoji} ${x.emoji} ❓`),
        L(`${p1.hanzi}说：“我的${x.hanzi}在哪儿？”`, `${p1.emoji} 💬 ${x.emoji} ❓`),
        L(`${p2.hanzi}说：“你看！${x.hanzi}${at(here)}。”`, `${p2.emoji} 💬 ${x.emoji} ${here.emoji}`),
        L(`${x.hanzi}${at(here)}。`, `${x.emoji} ${here.emoji}`, [
          Q(`${x.hanzi}${at(there)}吗？`, yesNo(), 1),
          choose(`${x.hanzi}${at(here)}还是${at(there)}？`, here.emoji, [there.emoji]),
        ]),
        L(`${p1.hanzi}很喜欢${x.hanzi}。`, `${p1.emoji} ❤️ ${x.emoji}`),
      ],
      questions: [
        choose(`${x.hanzi}在哪儿？`, here.emoji, PLACES.filter((p) => p !== here).map((p) => p.emoji)),
        choose(`这是谁的${x.hanzi}？`, p1.emoji, [p2.emoji]),
      ],
    }
  },
  // Sharing: 有三个 / 给你！ / 有几个
  (pick) => {
    const p1 = pick(PEOPLE), p2 = pick(PEOPLE, [p1]), p3 = pick(PEOPLE, [p1, p2])
    const f = pick(COUNTABLE), f2 = pick(COUNTABLE, [f])
    return {
      title: `${p1.hanzi}给你`, cover: f.emoji,
      lines: [
        L(`${p1.hanzi}有三个${f.hanzi}。`, `${p1.emoji} ${times(f.emoji, 3)}`),
        L(`${p1.hanzi}给${p2.hanzi}一个${f.hanzi}。`, `${p1.emoji} ${f.emoji} ➡️ ${p2.emoji}`, [
          choose(`${p1.hanzi}给${p2.hanzi}什么？`, f.emoji, [f2.emoji]),
        ]),
        L(`${p1.hanzi}说：“给你！”`, `${p1.emoji} 💬 ${f.emoji}`),
        L(`${p1.hanzi}也给${p3.hanzi}一个${f.hanzi}。`, `${p1.emoji} ${f.emoji} ➡️ ${p3.emoji}`, [
          choose(`谁给${p3.hanzi}${f.hanzi}？`, p1.emoji, [p2.emoji]),
        ]),
        L(`${p1.hanzi}有几个${f.hanzi}？${p1.hanzi}有一个${f.hanzi}。`, `${p1.emoji} ${f.emoji}`),
        L(`${p2.hanzi}和${p3.hanzi}很喜欢吃${f.hanzi}。`, `${p2.emoji} ${p3.emoji} ❤️ ${f.emoji}`),
      ],
      questions: [
        choose(`${p1.hanzi}有几个${f.hanzi}？`, counts(f.emoji)[0], counts(f.emoji).slice(1)),
        choose(`${p1.hanzi}给${p2.hanzi}什么？`, f.emoji, [f2.emoji]),
      ],
    }
  },
]

let serial = 0

/** A fresh mini-story (5–7 lines, circling questions, end questions) from a random template. */
export function generateStory(progress: Progress): Story {
  const t = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
  return { id: `gen-${Date.now()}-${serial++}`, ...t(picker(progress)) }
}
