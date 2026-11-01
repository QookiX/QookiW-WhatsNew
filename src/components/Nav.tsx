import { useEffect, useState } from 'react'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { IconGithub } from './Icons'

const LINKS = [
  { id: 'lab', label: '仓库总览' },
  { id: 'stream', label: '更新流' },
  { id: 'about', label: '数据说明' },
]

export function Nav({ org, minimal = false }: { org: string; minimal?: boolean }) {
  const { progress, stuck } = useScrollProgress()
  const [active, setActive] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-38% 0px -52% 0px', threshold: 0 },
    )
    for (const link of LINKS) {
      const el = document.getElementById(link.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const clear = () => {
      if (window.location.hash.startsWith('#/update/')) setActive('')
    }
    window.addEventListener('hashchange', clear)
    return () => window.removeEventListener('hashchange', clear)
  }, [])

  return (
    <header className={`nav${stuck ? ' nav--stuck' : ''}`}>
      <div className="shell nav__inner">
        <a className="nav__brand" href="#top">
          <img className="nav__mark" src="./brand/qookix-avatar.png" alt="" width={30} height={30} />
          <span className="nav__wordmark">
            QookiX<span>出炉日志</span>
          </span>
        </a>

        <nav className={`nav__links${minimal ? ' nav__links--off' : ''}`} aria-label="页面导航">
          {LINKS.map((link) => (
            <a
              className={`nav__link${active === link.id ? ' nav__link--active' : ''}`}
              href={`#${link.id}`}
              key={link.id}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav__actions">
          <a className="nav__gh" href={`https://github.com/${org}`} target="_blank" rel="noreferrer">
            <IconGithub size={14} />
            GitHub
          </a>
        </div>
      </div>
      <div
        className="nav__progress"
        style={{
          width: `${(progress * 100).toFixed(2)}%`,
          display: progress > 0.004 ? 'block' : 'none',
        }}
        aria-hidden="true"
      />
    </header>
  )
}
