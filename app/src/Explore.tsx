import type { Scene, Word } from './data/words'
import { WordCard } from './WordCard'

type Props = { scene: Scene; showText: boolean; onHear: (w: Word) => void }

/** Tap anything in the scene to hear it — pure listening, no quiz. */
export function Explore({ scene, showText, onHear }: Props) {
  return (
    <div className="grid">
      {scene.words.map((w) => (
        <WordCard key={w.id} word={w} showText={showText} onClick={() => onHear(w)} />
      ))}
    </div>
  )
}
