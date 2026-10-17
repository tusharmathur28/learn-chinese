/**
 * Renders a story picture string: space-separated emoji, "+" big, "-" small, "·" separator.
 * `highlight` lights up every emoji equal to it — like a parent pointing at the thing being named.
 */
export function Pic({ pic, className = '', highlight }: { pic: string; className?: string; highlight?: string | null }) {
  return (
    <span className={`pic ${className}`}>
      {pic.split(' ').map((t, i) => {
        if (t === '·') return <span key={i} className="sep" />
        const emoji = t.replace(/^[+-]/, '')
        const size = t[0] === '+' ? 'big' : t[0] === '-' ? 'small' : ''
        return (
          <span key={i} className={`${size} ${highlight && emoji === highlight ? 'hl' : ''}`}>
            {emoji}
          </span>
        )
      })}
    </span>
  )
}
