export type Word = { id: string; hanzi: string; pinyin: string; emoji: string }
export type Scene = { id: string; hanzi: string; pinyin: string; emoji: string; words: Word[] }

const w = (hanzi: string, pinyin: string, emoji: string): Word => ({ id: hanzi, hanzi, pinyin, emoji })

export const SCENES: Scene[] = [
  {
    id: 'food', hanzi: '吃的', pinyin: 'chī de', emoji: '🍎',
    words: [
      w('苹果', 'píngguǒ', '🍎'), w('香蕉', 'xiāngjiāo', '🍌'), w('西瓜', 'xīguā', '🍉'),
      w('葡萄', 'pútao', '🍇'), w('橙子', 'chéngzi', '🍊'), w('草莓', 'cǎoméi', '🍓'),
      w('面包', 'miànbāo', '🍞'), w('鸡蛋', 'jīdàn', '🥚'), w('牛奶', 'niúnǎi', '🥛'),
      w('米饭', 'mǐfàn', '🍚'), w('面条', 'miàntiáo', '🍜'), w('饺子', 'jiǎozi', '🥟'),
      w('茶', 'chá', '🍵'), w('蛋糕', 'dàngāo', '🍰'), w('冰淇淋', 'bīngqílín', '🍦'),
      w('胡萝卜', 'húluóbo', '🥕'),
    ],
  },
  {
    id: 'animals', hanzi: '动物', pinyin: 'dòngwù', emoji: '🐼',
    words: [
      w('狗', 'gǒu', '🐶'), w('猫', 'māo', '🐱'), w('鸟', 'niǎo', '🐦'), w('鱼', 'yú', '🐟'),
      w('马', 'mǎ', '🐴'), w('牛', 'niú', '🐮'), w('猪', 'zhū', '🐷'), w('羊', 'yáng', '🐑'),
      w('鸡', 'jī', '🐔'), w('兔子', 'tùzi', '🐰'), w('老虎', 'lǎohǔ', '🐯'), w('熊猫', 'xióngmāo', '🐼'),
      w('猴子', 'hóuzi', '🐵'), w('大象', 'dàxiàng', '🐘'), w('鸭子', 'yāzi', '🦆'), w('蛇', 'shé', '🐍'),
    ],
  },
  {
    id: 'things', hanzi: '东西', pinyin: 'dōngxi', emoji: '📱',
    words: [
      w('书', 'shū', '📖'), w('手机', 'shǒujī', '📱'), w('电脑', 'diànnǎo', '💻'), w('椅子', 'yǐzi', '🪑'),
      w('床', 'chuáng', '🛏️'), w('门', 'mén', '🚪'), w('钥匙', 'yàoshi', '🔑'), w('衣服', 'yīfu', '👕'),
      w('鞋', 'xié', '👟'), w('帽子', 'màozi', '🧢'), w('雨伞', 'yǔsǎn', '☂️'), w('闹钟', 'nàozhōng', '⏰'),
      w('车', 'chē', '🚗'), w('自行车', 'zìxíngchē', '🚲'), w('球', 'qiú', '⚽'), w('眼镜', 'yǎnjìng', '👓'),
    ],
  },
  {
    id: 'nature', hanzi: '大自然', pinyin: 'dàzìrán', emoji: '🌳',
    words: [
      w('花', 'huā', '🌸'), w('树', 'shù', '🌳'), w('太阳', 'tàiyáng', '☀️'), w('月亮', 'yuèliang', '🌙'),
      w('星星', 'xīngxing', '⭐'), w('山', 'shān', '⛰️'), w('雨', 'yǔ', '🌧️'), w('雪', 'xuě', '❄️'),
      w('火', 'huǒ', '🔥'), w('水', 'shuǐ', '💧'), w('云', 'yún', '☁️'), w('房子', 'fángzi', '🏠'),
    ],
  },
  {
    id: 'body', hanzi: '身体', pinyin: 'shēntǐ', emoji: '✋',
    words: [
      w('眼睛', 'yǎnjing', '👁️'), w('耳朵', 'ěrduo', '👂'), w('鼻子', 'bízi', '👃'),
      w('嘴', 'zuǐ', '👄'), w('手', 'shǒu', '✋'), w('脚', 'jiǎo', '🦶'),
    ],
  },
]

export const ALL_WORDS: Word[] = SCENES.flatMap((s) => s.words)

/** Words picked up from stories (people, verbs, grammar). Not used in "Show me". */
export const STORY_WORDS: Word[] = [
  w('小明', 'Xiǎomíng', '👦'), w('小红', 'Xiǎohóng', '👧'), w('妈妈', 'māma', '👩'), w('爸爸', 'bàba', '👨'),
  w('这', 'zhè', ''), w('是', 'shì', ''), w('不', 'bù', '❌'), w('对', 'duì', '✅'), w('吗', 'ma', '❓'),
  w('的', 'de', ''), w('哪个', 'nǎge', ''), w('在', 'zài', ''), w('哪儿', 'nǎr', ''), w('有', 'yǒu', ''),
  w('没有', 'méiyǒu', ''), w('一', 'yī', '1️⃣'), w('两', 'liǎng', '2️⃣'), w('三', 'sān', '3️⃣'),
  w('个', 'gè', ''), w('只', 'zhī', ''), w('几', 'jǐ', ''), w('很', 'hěn', ''), w('大', 'dà', ''),
  w('小', 'xiǎo', ''), w('吃', 'chī', '😋'), w('喝', 'hē', '🥤'), w('喜欢', 'xǐhuan', '❤️'), w('要', 'yào', '🙋'),
  w('看', 'kàn', '👀'), w('和', 'hé', ''), w('也', 'yě', ''), w('什么', 'shénme', ''), w('谁', 'shéi', ''),
  w('家', 'jiā', '🏠'), w('上', 'shàng', ''), w('去', 'qù', '➡️'), w('下', 'xià', ''), w('了', 'le', ''),
  w('今天', 'jīntiān', ''), w('给', 'gěi', '🫴'), w('竹子', 'zhúzi', '🎋'),
]
