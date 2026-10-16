/** Renders a story picture string: space-separated emoji, "+" big, "-" small, "·" separator. */
export function Pic({ pic, className = '' }: { pic: string; className?: string }) {
  return (
    <span className={`pic ${className}`}>
      {pic.split(' ').map((t, i) =>
        t === '·' ? (
          <span key={i} className="sep" />
        ) : (
          <span key={i} className={t[0] === '+' ? 'big' : t[0] === '-' ? 'small' : ''}>
            {t.replace(/^[+-]/, '')}
          </span>
        ),
      )}
    </span>
  )
}
