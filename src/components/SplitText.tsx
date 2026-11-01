import type { CSSProperties } from 'react'

/** 每个字的入场方向/角度用确定性的伪随机，避免每次渲染抖动 */
function charOffset(index: number) {
  const wave = (index * 37) % 11
  return {
    dx: ((wave % 5) - 2) * 0.06,
    dr: (wave % 2 === 0 ? -1 : 1) * (6 + (wave % 4) * 2),
  }
}

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
      {Array.from(text).map((char, index) => {
        const offset = charOffset(index)
        return (
          <span
            className="split__char"
            key={`${char}-${index}`}
            style={
              {
                '--i': index,
                '--d': `${delay}s`,
                '--step': `${step}s`,
                '--dx': `${offset.dx}em`,
                '--dr': `${offset.dr}deg`,
              } as CSSProperties
            }
          >
            <span className="split__inner">{char === ' ' ? '\u00a0' : char}</span>
          </span>
        )
      })}
    </span>
  )
}
