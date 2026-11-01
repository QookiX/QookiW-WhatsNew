import { useEffect, useRef, useState } from 'react'
import { useCountUp } from '../hooks/useCountUp'

function Cell({
  value,
  label,
  hint,
  active,
  pad,
}: {
  value: number
  label: string
  hint: string
  active: boolean
  pad?: boolean
}) {
  const shown = useCountUp(active ? value : 0)
  return (
    <div className="databand__cell">
      <span className="databand__value">
        {pad ? String(shown).padStart(2, '0') : shown.toLocaleString('en-US')}
      </span>
      <span className="databand__label">{label}</span>
      <span className="databand__hint">{hint}</span>
    </div>
  )
}

export function DataBand({
  repos,
  updates,
  releases,
  stars,
}: {
  repos: number
  updates: number
  releases: number
  stars: number
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setActive(true)
        observer.disconnect()
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className={`databand${active ? ' is-live' : ''}`} ref={ref} aria-label="数据概览">
      <div className="shell databand__inner">
        <span className="databand__caption" aria-hidden="true">
          At a glance
        </span>
        <Cell value={repos} label="Repositories" hint="仓库在维护" active={active} pad />
        <Cell value={updates} label="Updates" hint="条更新已收录" active={active} />
        <Cell value={releases} label="Releases" hint="个版本发布" active={active} />
        <Cell value={stars} label="Stars" hint="颗星合计" active={active} />
      </div>
    </section>
  )
}
