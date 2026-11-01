import type { CSSProperties } from 'react'

export function SplitText({
  text,
  delay = 0,
  step = 0.075,
  className,
}: {
  text: string
  delay?: number
  step?: number
  className?: string
}) {
  return (
    <span className={className ? `split ${className}` : 'split'}>
      {Array.from(text).map((char, index) => (
        <span
          className="split__char"
          key={`${char}-${index}`}
          style={
            {
              '--i': index,
              '--d': `${delay}s`,
              '--step': `${step}s`,
            } as CSSProperties
          }
        >
          <span className="split__inner">{char === ' ' ? '\u00a0' : char}</span>
        </span>
      ))}
    </span>
  )
}
