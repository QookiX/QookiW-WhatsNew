import { useEffect, useMemo, useState } from 'react'
import type { Repo, Update } from '../lib/types'
import { monthKey, monthLabel } from '../lib/format'
import { UpdateCard } from './UpdateCard'
import { IconChevronDown, IconCookie, IconSearch, IconX } from './Icons'

export type TypeFilter = 'all' | 'release' | 'commit'

const MONTHS_PER_PAGE = 2

interface Props {
  repos: Repo[]
  updates: Update[]
  activeRepo: string | null
  onRepoChange: (name: string | null) => void
  typeFilter: TypeFilter
  onTypeChange: (value: TypeFilter) => void
  query: string
  onQueryChange: (value: string) => void
  onOpen: (id: string) => void
}

export function UpdateStream({
  repos,
  updates,
  activeRepo,
  onRepoChange,
  typeFilter,
  onTypeChange,
  query,
  onQueryChange,
  onOpen,
}: Props) {
  const [monthLimit, setMonthLimit] = useState(MONTHS_PER_PAGE)

  const toneByRepo = useMemo(() => {
    const map = new Map<string, string>()
    for (const repo of repos) map.set(repo.name, repo.tone)
    return map
  }, [repos])

  const countsByRepo = useMemo(() => {
    const map = new Map<string, number>()
    for (const update of updates) {
      map.set(update.repo, (map.get(update.repo) ?? 0) + 1)
    }
    return map
  }, [updates])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return updates.filter((update) => {
      if (activeRepo && update.repo !== activeRepo) return false
      if (typeFilter !== 'all' && update.type !== typeFilter) return false
      if (!needle) return true
      if (update.repo.toLowerCase().includes(needle)) return true
      if (update.version?.toLowerCase().includes(needle)) return true
      return update.items.some(
        (item) =>
          item.text.toLowerCase().includes(needle) || item.module.toLowerCase().includes(needle),
      )
    })
  }, [updates, activeRepo, typeFilter, query])

  const groups = useMemo(() => {
    const map = new Map<string, Update[]>()
    for (const update of filtered) {
      const key = monthKey(update.date)
      const list = map.get(key)
      if (list) list.push(update)
      else map.set(key, [update])
    }
    return [...map.entries()]
  }, [filtered])

  useEffect(() => {
    setMonthLimit(MONTHS_PER_PAGE)
  }, [activeRepo, typeFilter, query])

  const visibleGroups = groups.slice(0, monthLimit)
  const remaining = groups.length - visibleGroups.length
  const hasFilter = Boolean(activeRepo) || typeFilter !== 'all' || Boolean(query.trim())

  const reset = () => {
    onRepoChange(null)
    onTypeChange('all')
    onQueryChange('')
  }

  return (
    <div className="stream">
      <aside className="rail">
        <div>
          <div className="rail__block-title">
            <span>搜索</span>
          </div>
          <label className="search">
            <span className="search__icon">
              <IconSearch size={14} />
            </span>
            <input
              className="search__input"
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="模块 / 版本 / 关键词"
            />
            {query ? (
              <button
                type="button"
                className="search__clear"
                onClick={() => onQueryChange('')}
                aria-label="清除搜索"
              >
                <IconX size={12} />
              </button>
            ) : null}
          </label>
        </div>

        <div>
          <div className="rail__block-title">
            <span>仓库</span>
            <span>{repos.length}</span>
          </div>
          <div className="rail__repos">
            <button
              type="button"
              className={`rail__repo${activeRepo === null ? ' rail__repo--on' : ''}`}
              onClick={() => onRepoChange(null)}
            >
              <i className="rail__repo-dot" style={{ ['--tone' as string]: 'var(--biscuit)' }} />
              <span className="rail__repo-name">全部仓库</span>
              <span className="rail__repo-count">{updates.length}</span>
            </button>
            {repos.map((repo) => (
              <button
                type="button"
                key={repo.name}
                className={`rail__repo${activeRepo === repo.name ? ' rail__repo--on' : ''}`}
                onClick={() => onRepoChange(activeRepo === repo.name ? null : repo.name)}
              >
                <i className="rail__repo-dot" style={{ ['--tone' as string]: repo.tone }} />
                <span className="rail__repo-name">{repo.name}</span>
                <span className="rail__repo-count">{countsByRepo.get(repo.name) ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="rail__block-title">
            <span>类型</span>
          </div>
          <div className="rail__seg">
            {(
              [
                ['all', '全部'],
                ['release', '版本'],
                ['commit', '提交'],
              ] as Array<[TypeFilter, string]>
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={typeFilter === value}
                onClick={() => onTypeChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rail__foot">
          {filtered.length} 条结果
          {hasFilter ? (
            <>
              <br />
              <button type="button" onClick={reset} style={{ color: 'var(--caramel)', marginTop: 6 }}>
                重置全部筛选
              </button>
            </>
          ) : null}
        </div>
      </aside>

      <div className="stream__main">
        {visibleGroups.length === 0 ? (
          <div className="state">
            <span className="state__icon">
              <IconCookie size={30} />
            </span>
            <p className="state__title">烤盘是空的</p>
            <p className="state__desc">
              当前筛选条件下没有任何更新。换个关键词，或者把筛选重置回去看看整炉的东西。
            </p>
            <button type="button" className="state__action" onClick={reset}>
              重置筛选
            </button>
          </div>
        ) : (
          <>
            {visibleGroups.map(([key, list]) => (
              <section className="month" key={key}>
                <div className="month__head">
                  <span className="month__label">{monthLabel(key)}</span>
                  <span className="month__count">{list.length} 条</span>
                  <span className="month__line" />
                </div>
                <div className="month__list">
                  {list.map((update) => (
                    <UpdateCard
                      key={update.id}
                      update={update}
                      tone={toneByRepo.get(update.repo) ?? 'var(--caramel)'}
                      query={query}
                      onOpen={onOpen}
                    />
                  ))}
                </div>
              </section>
            ))}

            {remaining > 0 ? (
              <div className="loadmore">
                <button type="button" onClick={() => setMonthLimit((value) => value + 3)}>
                  更早的更新
                  <span className="loadmore__hint">
                    已显示 {visibleGroups.reduce((sum, [, list]) => sum + list.length, 0)} /{' '}
                    {filtered.length}
                  </span>
                  <IconChevronDown size={13} />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
