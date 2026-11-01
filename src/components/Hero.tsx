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

function Stat({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const shown = useCountUp(value)
  return (
    <div className="stat">
      <span className="stat__value">
        {shown.toLocaleString('en-US')}
        {suffix ? <small>{suffix}</small> : null}
      </span>
      <span className="stat__label">{label}</span>
    </div>
  )
}

export function Hero({ stats, org }: { stats: HeroStats; org: string }) {
  const heroRef = useRef<HTMLElement | null>(null)

  // 滚动视差：hero 内容上浮淡出，饼干下沉
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

  const reveal = {
    hidden: { opacity: 0, y: 18 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.06 * i, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
    }),
  }

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
          <motion.p
            className="hero__eyebrow eyebrow"
            variants={reveal}
            initial="hidden"
            animate="show"
            custom={0}
          >
            QookiX · Organization Updates
          </motion.p>

          <motion.h1
            className="hero__title hero__title--live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <span className="hero__title-line">
              <SplitText text="每一次改动" delay={0.22} />
            </span>
            <span className="hero__title-line hero__title-line--outline">
              <SplitText text="都算" delay={0.46} />
              <SplitText text="数" delay={0.56} className="hero__title-accent" />
            </span>
          </motion.h1>

          <motion.p className="hero__desc" variants={reveal} initial="hidden" animate="show" custom={3}>
            把 <strong>{stats.repos} 个仓库</strong> 的版本日志与提交记录摊在同一张烤盘上 ——
            谁刚出炉、烤了什么，一眼看完。
          </motion.p>

          <motion.div className="hero__meta" variants={reveal} initial="hidden" animate="show" custom={4}>
            <span>{stats.releases} releases</span>
            <i className="hero__meta-dot" />
            <span>{stats.commits} commits</span>
            <i className="hero__meta-dot" />
            <span>last baked {relativeTime(stats.latestDate)}</span>
          </motion.div>

          <div className="hero__ticks" aria-hidden="true" />

          <motion.div className="hero__stats" variants={reveal} initial="hidden" animate="show" custom={5}>
            <Stat value={stats.repos} label="个仓库在维护" />
            <Stat value={stats.updates} label="条更新已收录" />
            <Stat value={stats.releases} label="个版本发布" />
            <Stat value={stats.stars} label="颗星合计" />
          </motion.div>
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
