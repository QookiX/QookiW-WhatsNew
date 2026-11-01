import { useEffect, useMemo } from 'react'
import type { ReleaseAsset, Repo, Update } from '../lib/types'
import { shortDate, relativeTime } from '../lib/format'
import {
  KIND_ICON,
  KIND_LABEL,
  IconArrowRight,
  IconArrowUpRight,
  IconDownload,
  IconFile,
  IconGithub,
} from './Icons'

const INSTALLER = /\.(apk|exe|msi|dmg|pkg|zip|7z|tar\.gz|tgz|rpm|deb|appimage)$/i

const EXT_WEIGHT: Array<[string, number]> = [
  ['.apk', 1],
  ['.exe', 2],
  ['.msi', 3],
  ['.dmg', 4],
  ['.appimage', 5],
  ['.deb', 6],
  ['.rpm', 7],
  ['.pkg', 8],
  ['.tar.gz', 9],
  ['.tgz', 10],
  ['.zip', 11],
  ['.7z', 12],
]

function assetWeight(name: string): number {
  const lower = name.toLowerCase()
  for (const [ext, weight] of EXT_WEIGHT) {
    if (lower.endsWith(ext)) return weight
  }
  return 40
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}

function AssetRow({ asset }: { asset: ReleaseAsset }) {
  const primary = INSTALLER.test(asset.name)
  return (
    <a
      className={primary ? 'asset asset--primary' : 'asset'}
      href={asset.url}
      target="_blank"
      rel="noreferrer"
    >
      <span className="asset__icon">
        {primary ? <IconDownload size={15} /> : <IconFile size={15} />}
      </span>
      <span className="asset__body">
        <span className="asset__name">{asset.name}</span>
        <span className="asset__meta">
          {formatBytes(asset.size)}
          <i />
          {asset.downloads} 次下载
        </span>
      </span>
      <IconArrowUpRight size={13} />
    </a>
  )
}

export function UpdatePage({
  update,
  repo,
  onBack,
}: {
  update: Update
  repo: Repo | undefined
  onBack: () => void
}) {
  useEffect(() => {
    const previous = document.title
    document.title = `${update.repo} ${update.version ?? update.sha ?? ''} · QookiX 出炉日志`
    return () => {
      document.title = previous
    }
  }, [update])

  const release = update.release ?? null
  const assets = release?.assets ?? []
  const installers = assets
    .filter((asset) => INSTALLER.test(asset.name))
    .sort((a, b) => assetWeight(a.name) - assetWeight(b.name) || b.size - a.size)
  const others = assets.filter((asset) => !INSTALLER.test(asset.name))

  const groups = useMemo(() => {
    const map = new Map<string, Update['items']>()
    for (const item of update.items) {
      const key = item.section || ''
      const list = map.get(key)
      if (list) list.push(item)
      else map.set(key, [item])
    }
    return [...map.entries()]
  }, [update.items])

  const isCommit = update.type === 'commit'

  return (
    <main className="u-page" style={{ ['--tone' as string]: repo?.tone ?? 'var(--caramel)' }}>
      <div className="shell u-page__shell">
        <div className="u-page__crumb">
          <button type="button" className="u-back" onClick={onBack}>
            <IconArrowRight size={13} style={{ transform: 'rotate(180deg)' }} />
            返回更新流
          </button>
          <span className="u-page__path">
            {update.repo}
            <i>/</i>
            {update.version ?? update.sha}
          </span>
        </div>

        <header className="u-page__head">
          <span className="u-page__eyebrow">
            <i />
            {update.repo} · {isCommit ? 'Commit' : 'Release'}
            {release?.prerelease ? <em>预发布</em> : null}
          </span>

          <h1 className="u-page__title">
            {update.version ? (
              <>
                <small>v</small>
                {update.version}
              </>
            ) : (
              update.sha
            )}
          </h1>

          <p className="u-page__sub">
            {repo?.description || '这个仓库还没有写下描述。'}
          </p>

          <div className="u-page__stats">
            <span>
              <i>发布</i>
              {shortDate(update.date)}
            </span>
            <span>
              <i>距今</i>
              {relativeTime(update.date)}
            </span>
            <span>
              <i>条目</i>
              {update.items.length}
            </span>
            {release ? (
              <span>
                <i>Tag</i>
                {release.tag}
              </span>
            ) : null}
            {installers.length > 0 ? (
              <span>
                <i>安装包</i>
                {installers.length} 个
              </span>
            ) : null}
          </div>
        </header>

        <div className="u-page__grid">
          <div className="u-page__main">
            {update.notes.length > 0 ? (
              <blockquote className="u-page__notes">
                {update.notes.map((note, index) => (
                  <p key={index}>{note}</p>
                ))}
              </blockquote>
            ) : null}

            {installers.length > 0 || others.length > 0 ? (
              <section className="u-section">
                <h2 className="u-section__title">
                  下载
                  <span>{assets.length} 个文件</span>
                </h2>
                <div className="u-assets">
                  {installers.map((asset) => (
                    <AssetRow asset={asset} key={asset.name} />
                  ))}
                  {others.map((asset) => (
                    <AssetRow asset={asset} key={asset.name} />
                  ))}
                </div>
              </section>
            ) : null}

            {!isCommit ? (
              <section className="u-section">
                <h2 className="u-section__title">
                  全部改动
                  <span>{update.items.length} 条</span>
                </h2>
                {groups.map(([section, items], groupIndex) => (
                  <div className="u-group" key={`${section}-${groupIndex}`}>
                    {section ? <p className="u-group__title">{section}</p> : null}
                    <ul className="u-list">
                      {items.map((item, index) => {
                        const Icon = KIND_ICON[item.kind]
                        return (
                          <li className={`u-item u-item--${item.kind}`} key={index}>
                            <span className="u-item__icon">
                              <Icon size={13} />
                            </span>
                            <span className="u-item__body">
                              <span className="u-item__head">
                                {item.module ? <b>{item.module}</b> : null}
                                <em>{KIND_LABEL[item.kind]}</em>
                              </span>
                              <span className="u-item__text">{item.text}</span>
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </section>
            ) : (
              <section className="u-section">
                <h2 className="u-section__title">提交内容</h2>
                <p className="u-commit">
                  {update.items[0]?.module ? (
                    <span className="u-commit__module">{update.items[0].module}</span>
                  ) : null}
                  {update.items[0]?.text}
                </p>
              </section>
            )}
          </div>

          <aside className="u-page__side">
            <div className="u-side">
              <p className="u-side__title">仓库</p>
              <p className="u-side__name">{update.repo}</p>
              <p className="u-side__desc">{repo?.description || '暂无描述'}</p>
              <div className="u-side__row">
                <span>语言</span>
                <b>
                  {repo?.language ? (
                    <>
                      <i className="u-side__dot" style={{ background: repo.languageColor }} />
                      {repo.language}
                    </>
                  ) : (
                    '—'
                  )}
                </b>
              </div>
              <div className="u-side__row">
                <span>星标</span>
                <b>{repo?.stars ?? 0}</b>
              </div>
              <div className="u-side__row">
                <span>更新数</span>
                <b>{repo?.updateCount ?? 0}</b>
              </div>
            </div>

            <div className="u-side">
              <p className="u-side__title">链接</p>
              <a className="u-side__link" href={update.url} target="_blank" rel="noreferrer">
                <IconGithub size={14} />
                在 GitHub 查看{isCommit ? '提交' : '发布'}
                <IconArrowUpRight size={12} />
              </a>
              {update.changelogUrl ? (
                <a
                  className="u-side__link"
                  href={update.changelogUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  CHANGELOG
                  <IconArrowUpRight size={12} />
                </a>
              ) : null}
              {repo?.htmlUrl ? (
                <a className="u-side__link" href={repo.htmlUrl} target="_blank" rel="noreferrer">
                  仓库主页
                  <IconArrowUpRight size={12} />
                </a>
              ) : null}
            </div>
          </aside>
        </div>

        <div className="u-page__foot">
          <button type="button" className="u-back u-back--lg" onClick={onBack}>
            <IconArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
            返回更新流
          </button>
        </div>
      </div>
    </main>
  )
}
