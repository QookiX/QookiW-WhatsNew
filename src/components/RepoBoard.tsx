import type { PointerEvent } from 'react'
import type { Repo, Update } from '../lib/types'
import { relativeTime } from '../lib/format'
import { IconArrowRight, IconArrowUpRight, IconStar } from './Icons'

function spotlight(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  el.style.setProperty('--my', `${event.clientY - rect.top}px`)
}

const MAX_TILT = 9

function tiltTrack(event: PointerEvent<HTMLElement>) {
  spotlight(event)
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  const px = (event.clientX - rect.left) / (rect.width || 1) - 0.5
  const py = (event.clientY - rect.top) / (rect.height || 1) - 0.5
  el.style.setProperty('--ty', `${(px * MAX_TILT * 2.4).toFixed(2)}deg`)
  el.style.setProperty('--tx', `${(-py * MAX_TILT * 1.6).toFixed(2)}deg`)
  el.classList.add('is-live')
}

function tiltReset(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget
  el.style.setProperty('--ty', '0deg')
  el.style.setProperty('--tx', '0deg')
  el.classList.remove('is-live')
}

function FeatureCard({
  repo,
  latest,
  onSelect,
}: {
  repo: Repo
  latest: Update | undefined
  onSelect: (name: string) => void
}) {
  const samples = latest?.items.slice(0, 3) ?? []

  return (
    <button
      type="button"
      className="feature tilt"
      style={{ ['--tone' as string]: repo.tone }}
      onPointerMove={tiltTrack}
      onPointerLeave={tiltReset}
      onClick={() => onSelect(repo.name)}
    >
      <span className="feature__scan" aria-hidden="true" />
      <span className="feature__top">
        <span className="feature__dot" />
        <span className="feature__name">{repo.name}</span>
        <span className="feature__spacer" />
        <span className="feature__source">{repo.source === 'changelog' ? 'changelog' : 'commits'}</span>
      </span>

      <p className="feature__desc">{repo.description || '这个仓库还没有写下描述。'}</p>

      {samples.length > 0 ? (
        <span className="feature__samples">
          {samples.map((item, index) => (
            <span className="feature__sample" key={index}>
              <span className="feature__sample-tag">{item.module || '变更'}</span>
              <span className="feature__sample-text">{item.text}</span>
            </span>
          ))}
        </span>
      ) : (
        <span className="feature__samples">
          <span className="feature__sample">
            <span className="feature__sample-tag">暂无</span>
            <span className="feature__sample-text">还没有可展示的更新条目</span>
          </span>
        </span>
      )}

      <span className="feature__foot">
        <span className="feature__version">{repo.latestVersion ? `v${repo.latestVersion}` : '—'}</span>
        <span>{relativeTime(repo.latestDate)}</span>
        <span className="feature__spacer" />
        <span className="feature__arrow">
          <IconArrowRight size={15} />
        </span>
      </span>
    </button>
  )
}

export function RepoBoard({
  repos,
  updates,
  onSelect,
}: {
  repos: Repo[]
  updates: Update[]
  onSelect: (name: string) => void
}) {
  const latestByRepo = new Map<string, Update>()
  for (const update of updates) {
    if (!latestByRepo.has(update.repo)) latestByRepo.set(update.repo, update)
  }

  const primary = repos.filter((repo) => repo.source === 'changelog').slice(0, 2)
  const rest = repos.filter((repo) => !primary.includes(repo))
  const trailing = rest.slice(-1)
  const middle = rest.slice(0, -1)

  return (
    <div className="lab reveal" data-reveal-delay="80">
      <div className="lab__primary">
        {primary.map((repo) => (
          <FeatureCard key={repo.name} repo={repo} latest={latestByRepo.get(repo.name)} onSelect={onSelect} />
        ))}
      </div>

      <div className="roster">
        <div className="roster__head">
          <span className="roster__title">其余仓库</span>
          <span className="roster__title">{String(rest.length).padStart(2, '0')}</span>
        </div>

        {[...middle, ...trailing].map((repo, index) => (
          <button
            type="button"
            className="roster__row"
            key={repo.name}
            onClick={() => onSelect(repo.name)}
          >
            <span className="roster__index">{String(index + 1).padStart(2, '0')}</span>
            <span className="roster__main">
              <span className="roster__name">{repo.name}</span>
              <span className="roster__desc">{repo.description || '暂无描述'}</span>
            </span>
            <span className="roster__side">
              {repo.language ? (
                <span className="roster__lang">
                  <i className="roster__lang-dot" style={{ ['--lang' as string]: repo.languageColor }} />
                  {repo.language}
                </span>
              ) : null}
              <span className="roster__lang">
                <IconStar size={11} />
                {repo.stars}
              </span>
              <span>{relativeTime(repo.pushedAt)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function RepoBoardHint({ org }: { org: string }) {
  return (
    <a className="board__org" href={`https://github.com/${org}`} target="_blank" rel="noreferrer">
      在 GitHub 上查看组织
      <IconArrowUpRight size={13} />
    </a>
  )
}
