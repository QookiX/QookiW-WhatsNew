import type { ReactNode } from 'react'

export function SectionHead({
  index,
  label,
  title,
  children,
}: {
  index: string
  label: string
  title: string
  children?: ReactNode
}) {
  return (
    <div className="section__head reveal">
      <span className="section__ghost" aria-hidden="true">
        {index}
      </span>
      <div className="section__heading">
        <span className="section__index">{label}</span>
        <h2 className="section__title">{title}</h2>
      </div>
      {children ? <div className="section__aside">{children}</div> : null}
    </div>
  )
}
