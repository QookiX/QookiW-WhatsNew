const WORDS = [
  'FRESH FROM THE OVEN',
  'CHANGELOG',
  'COMMIT STREAM',
  'LAUNCHER',
  'ANDROID',
  'TRANSLATE',
  'DOCS',
  'WHAT IS NEW',
]

function Row({ reverse = false }: { reverse?: boolean }) {
  const items = [...WORDS, ...WORDS]
  return (
    <div className={reverse ? 'marquee__row marquee__row--rev' : 'marquee__row'}>
      <div className="marquee__track">
        {items.map((word, index) => (
          <span className="marquee__item" key={`${word}-${index}`}>
            {word}
            <i className="marquee__star" aria-hidden="true">
              ✦
            </i>
          </span>
        ))}
      </div>
    </div>
  )
}

export function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <Row />
      <Row reverse />
    </div>
  )
}
