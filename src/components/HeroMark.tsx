import { useEffect, useRef } from 'react'

const MEMBERS = [
  {
    name: 'ZhaYi',
    login: 'ZhaYi-Miao',
    role: 'Owner',
    avatar: './brand/member-zayi.png',
  },
  {
    name: '维墨笙',
    login: 'weimosheng',
    role: 'Owner',
    avatar: './brand/member-weimosheng.png',
  },
]

export interface MarkStats {
  repos: number
  releases: number
  commits: number
  stars: number
}

export function HeroMark({
  avatar,
  org,
  stats,
  latest,
}: {
  avatar: string
  org: string
  stats: MarkStats
  latest: string
}) {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(hover: none)').matches) return

    let frame = 0
    let nextX = 0
    let nextY = 0

    const apply = () => {
      frame = 0
      el.style.setProperty('--ry', `${nextX.toFixed(2)}deg`)
      el.style.setProperty('--rx', `${nextY.toFixed(2)}deg`)
    }

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (event.clientX - cx) / (rect.width || 1)
      const dy = (event.clientY - cy) / (rect.height || 1)
      nextX = Math.max(-1, Math.min(1, dx)) * 13
      nextY = Math.max(-1, Math.min(1, dy)) * -13
      if (!frame) frame = requestAnimationFrame(apply)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="hero__art">
      <div className="cookie-stage" ref={stageRef}>
        <div className="cookie">
          <span className="cookie__aura" aria-hidden="true" />
          <span className="cookie__rays" aria-hidden="true" />
          <span className="cookie__radar" aria-hidden="true" />
          <span className="cookie__ring" aria-hidden="true" />
          <span className="cookie__arc" aria-hidden="true" />
          <span className="cookie__dial" aria-hidden="true" />
          <span className="cookie__dial cookie__dial--inner" aria-hidden="true" />
          <span className="cookie__axis" aria-hidden="true">
            <i />
            <i />
          </span>
          <span className="cookie__reticle" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>

          <div className="cookie__holder">
            <img
              className="cookie__avatar"
              src={avatar}
              alt={`${org} 组织头像`}
              width={460}
              height={460}
              draggable={false}
            />
            <span className="cookie__sweep" aria-hidden="true" />
          </div>

          {MEMBERS.map((member, index) => (
            <a
              className={`mark mark--${index === 0 ? 'a' : 'b'}`}
              href={`https://github.com/${member.login}`}
              target="_blank"
              rel="noreferrer"
              key={member.login}
            >
              <svg className="mark__wire" viewBox="0 0 66 34" fill="none" aria-hidden="true">
                <path
                  d="M0 27 L24 27 L46 5 L66 5"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
                <circle cx="0" cy="27" r="2.4" fill="currentColor" />
              </svg>
              <span className="mark__card">
                <span className="mark__avatar">
                  <img src={member.avatar} alt="" width={32} height={32} />
                </span>
                <span className="mark__text">
                  <b>{member.name}</b>
                  <i>{member.role}</i>
                </span>
              </span>
            </a>
          ))}

          <div className="cookie__meta">
            <div className="cookie__meta-row">
              <span className="cookie__live">
                <i />
                Live
              </span>
              <span>{String(stats.repos).padStart(2, '0')} repos</span>
              <span>{stats.releases} rel</span>
              <span>{String(stats.commits).padStart(3, '0')} cmt</span>
              <span>{String(stats.stars).padStart(3, '0')} star</span>
            </div>
            <div className="cookie__meta-row cookie__meta-row--sub">
              <span className="cookie__meta-label">Latest</span>
              <span>{latest}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
