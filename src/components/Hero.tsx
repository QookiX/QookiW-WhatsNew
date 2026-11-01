import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { HeroMark } from './HeroMark'
import { SplitText } from './SplitText'
import { useCountUp } from '../hooks/useCountUp'
import { relativeTime, compactNumber } from '../lib/format'

export interface HeroStats {
  repos: number
  updates: number
  releases: number
  commits: number
  stars: number
  latestDate: string | null
  latestRepo: string | null
  latestStars: number
  firstDate: string | null
}

function Stat({
  value,
  label,
  index,
}: {
  value: number
  label: string
  index: number
}) {
  const shown = useCountUp(value)
  return (
    <div className="stat wipe-in" style={{ ['--wd' as string]: `${0.95 + index * 0.09}s` }}>
      <span className="stat__value">{shown.toLocaleString('en-US')}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}

export function Hero({ stats, org }: { stats: HeroStats; org: string }) {
  const heroRef = useRef<HTMLElement | null>(null)

  // 滚动视差
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const span = rect.height || 1
      const progress = Math.min(1, Math.max(0, -rect.top / span))
      el.style.setProperty('--sp', progress.toFixed(3))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // 字符引力：指针靠近时单字被推开
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(hover: none)').matches) return

    const chars = Array.from(el.querySelectorAll<HTMLElement>('.hero__title .split__inner'))
    if (chars.length === 0) return

    let frame = 0
    let px = -9999
    let py = -9999

    const apply = () => {
      frame = 0
      for (const char of chars) {
        const rect = char.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = cx - px
        const dy = cy - py
        const dist = Math.hypot(dx, dy)
        const radius = 260

        if (dist > radius || dist < 1) {
          char.style.setProperty('--px', '0px')
          char.style.setProperty('--py', '0px')
          continue
        }

        const force = (1 - dist / radius) ** 2
        char.style.setProperty('--px', `${(-dx / dist) * force * 18}px`)
        char.style.setProperty('--py', `${(-dy / dist) * force * 18}px`)
      }
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }

    const onMove = (event: PointerEvent) => {
      px = event.clientX
      py = event.clientY
      schedule()
    }

    const onLeave = () => {
      px = -9999
      py = -9999
      schedule()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section className="hero" id="top" ref={heroRef}>
      <span className="hero__flash" aria-hidden="true" />
      <div className="hero__grid-bg" aria-hidden="true" />
      <div className="hero__floor" aria-hidden="true" />
      <div className="hero__godrays" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="hud hud--tl" aria-hidden="true">
        <i />
        OVEN 180°C
      </div>
      <div className="hud hud--tr" aria-hidden="true">
        TRAY / {String(stats.repos).padStart(2, '0')}
        <i />
      </div>
      <div className="hud hud--br" aria-hidden="true">
        {relativeTime(stats.latestDate)}
        <i />
      </div>

      <div className="shell hero__inner">
        <div className="hero__copy">
          <p className="hero__eyebrow eyebrow wipe-in" style={{ ['--wd' as string]: '0.45s' }}>
            QookiX · Organization Updates
          </p>

          <motion.h1
            className="hero__title hero__title--live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <span className="hero__title-line">
              <SplitText text="每一次改动" delay={0.35} />
            </span>
            <span className="hero__title-line hero__title-line--outline">
              <SplitText text="都算" delay={0.62} />
              <SplitText text="数" delay={0.74} className="hero__title-accent" />
            </span>
          </motion.h1>

          <p className="hero__desc wipe-in" style={{ ['--wd' as string]: '0.98s' }}>
            把 <strong>{stats.repos} 个仓库</strong> 的版本日志与提交记录摊在同一张烤盘上 ——
            谁刚出炉、烤了什么，一眼看完。
          </p>

          <div className="hero__meta wipe-in" style={{ ['--wd' as string]: '1.08s' }}>
            <span>{stats.releases} releases</span>
            <i className="hero__meta-dot" />
            <span>{stats.commits} commits</span>
            <i className="hero__meta-dot" />
            <span>last baked {relativeTime(stats.latestDate)}</span>
          </div>

          <div className="hero__ticks" aria-hidden="true" />

          <div className="hero__stats">
            <Stat value={stats.repos} label="个仓库在维护" index={0} />
            <Stat value={stats.updates} label="条更新已收录" index={1} />
            <Stat value={stats.releases} label="个版本发布" index={2} />
            <Stat value={stats.stars} label="颗星合计" index={3} />
          </div>
        </div>

        <motion.div
          className="hero__art-slot"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroMark
            avatar="./brand/qookix-avatar.png"
            org={org}
            stats={{
              repos: stats.repos,
              releases: stats.releases,
              commits: stats.commits,
              stars: stats.stars,
            }}
            latest={
              stats.latestRepo
                ? `${stats.latestRepo} · ${compactNumber(stats.latestStars)}★`
                : '刚刚出炉'
            }
          />
        </motion.div>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span className="hero__scroll-line" />
        <span>Scroll</span>
      </div>
    </section>
  )
}
