import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Snapshot } from './lib/types'
import { loadSnapshot } from './lib/data'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Marquee } from './components/Marquee'
import { RepoBoard, RepoBoardHint } from './components/RepoBoard'
import { UpdateStream } from './components/UpdateStream'
import type { TypeFilter } from './components/UpdateStream'
import { AboutSection, Footer } from './components/Footer'
import { BootScreen } from './components/BootScreen'
import { DataBand } from './components/DataBand'
import { SectionHead } from './components/SectionHead'
import { FxLayer } from './components/FxLayer'
import { UpdatePage } from './components/UpdatePage'
import { IconCookie } from './components/Icons'
import { useReveal } from './hooks/useReveal'

type Status = 'loading' | 'ready' | 'error'

export default function App() {
  const [status, setStatus] = useState<Status>('loading')
  const [data, setData] = useState<Snapshot | null>(null)
  const [error, setError] = useState('')
  const [activeRepo, setActiveRepo] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [query, setQuery] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const streamRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const snapshot = await loadSnapshot()
      setData(snapshot)
      setStatus('ready')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // 详情视图与 URL hash 同步，支持浏览器前进后退
  useEffect(() => {
    const read = () => {
      const match = window.location.hash.match(/^#\/update\/(.+)$/)
      setDetailId(match ? decodeURIComponent(match[1]) : null)
    }
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])

  const scrollPos = useRef(0)

  const openDetail = useCallback((id: string) => {
    scrollPos.current = window.scrollY
    window.location.hash = `#/update/${encodeURIComponent(id)}`
    setDetailId(id)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])

  const closeDetail = useCallback(() => {
    window.history.pushState(null, '', window.location.pathname + window.location.search)
    setDetailId(null)
    const top = scrollPos.current
    requestAnimationFrame(() => window.scrollTo({ top, behavior: 'instant' as ScrollBehavior }))
  }, [])

  const stats = useMemo(() => {
    if (!data) {
      return {
        repos: 0,
        updates: 0,
        releases: 0,
        commits: 0,
        stars: 0,
        latestDate: null,
        latestRepo: null,
        latestStars: 0,
        firstDate: null,
      }
    }
    const releases = data.updates.filter((update) => update.type === 'release')
    const commits = data.updates.filter((update) => update.type === 'commit')
    const newest = data.updates[0] ?? null
    return {
      repos: data.repos.length,
      updates: data.updates.length,
      releases: releases.length,
      commits: commits.length,
      stars: data.repos.reduce((sum, repo) => sum + repo.stars, 0),
      latestDate: newest?.date ?? null,
      latestRepo: newest?.repo ?? null,
      latestStars: data.repos.find((repo) => repo.name === newest?.repo)?.stars ?? 0,
      firstDate: data.updates[data.updates.length - 1]?.date ?? null,
    }
  }, [data])

  const detail = useMemo(() => {
    if (!detailId || !data) return null
    return data.updates.find((update) => update.id === detailId) ?? null
  }, [detailId, data])

  const detailRepo = useMemo(() => {
    if (!detail || !data) return undefined
    return data.repos.find((repo) => repo.name === detail.repo)
  }, [detail, data])

  useReveal([status, data])

  const selectRepo = useCallback((name: string | null) => {
    setActiveRepo(name)
    if (!name) return
    window.setTimeout(() => {
      streamRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
  }, [])

  if (status === 'loading') {
    return (
      <>
        <FxLayer />
        <div className="grain" aria-hidden="true" />
        <div className="ambient" aria-hidden="true">
          <span className="ambient__blob ambient__blob--a" />
          <span className="ambient__blob ambient__blob--b" />
        </div>
        <BootScreen />
      </>
    )
  }

  if (status === 'error' || !data) {
    return (
      <>
        <div className="grain" aria-hidden="true" />
        <div className="boot">
          <div className="state" style={{ width: '100%', maxWidth: 620 }}>
            <span className="state__icon">
              <IconCookie size={32} />
            </span>
            <p className="state__title">烤箱没热起来</p>
            <p className="state__desc">{error}</p>
            <button type="button" className="state__action" onClick={() => void load()}>
              重新加载
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <FxLayer />
      <div className="grain" aria-hidden="true" />
      <div className="ambient" aria-hidden="true">
        <span className="ambient__blob ambient__blob--a" />
        <span className="ambient__blob ambient__blob--b" />
        <span className="ambient__blob ambient__blob--c" />
      </div>
      <div className="page-grid" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <Nav org={data.org} minimal={Boolean(detail)} />

      {detail ? (
        <UpdatePage update={detail} repo={detailRepo} onBack={closeDetail} />
      ) : (
        <main>
        <Hero stats={stats} org={data.org} />
        <Marquee />
        <DataBand
          repos={stats.repos}
          updates={stats.updates}
          releases={stats.releases}
          stars={stats.stars}
        />

        <section className="section" id="lab">
          <div className="shell">
            <SectionHead
              index="01"
              label="仓库总览"
              title={`烤盘上的 ${data.repos.length} 个仓库`}
            >
              <p className="section__hint">
                点任意一个仓库，下面的更新流会立刻筛到它。带 changelog 的项目排在前面。
              </p>
              <RepoBoardHint org={data.org} />
            </SectionHead>
            <RepoBoard repos={data.repos} updates={data.updates} onSelect={selectRepo} />
          </div>
        </section>

        <section className="section" id="stream" ref={streamRef}>
          <div className="shell">
            <SectionHead
              index="02"
              label="更新流"
              title={activeRepo ? activeRepo : '全部更新，按出炉时间排列'}
            >
              <p className="section__hint">
                {typeFilter === 'commit'
                  ? '只显示没有 changelog 的仓库的提交记录。'
                  : typeFilter === 'release'
                    ? '只显示带版本号的正式发布。'
                    : '版本发布与提交记录混在一起，最新的在最上面。'}
              </p>
            </SectionHead>

            <UpdateStream
              repos={data.repos}
              updates={data.updates}
              activeRepo={activeRepo}
              onRepoChange={setActiveRepo}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              query={query}
              onQueryChange={setQuery}
              onOpen={openDetail}
            />
          </div>
        </section>

        <AboutSection data={data} />
        </main>
      )}

      <Footer data={data} />
    </>
  )
}
