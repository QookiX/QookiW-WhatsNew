import type { ReactNode } from 'react'
import type { Update } from '../lib/types'
import { shortDate, isFresh } from '../lib/format'
import { KIND_ICON, IconArrowRight } from './Icons'

const PREVIEW_LIMIT = 3

function highlight(text: string, query: string): ReactNode {
  const needle = query.trim().toLowerCase()
  if (!needle) return text
  const index = text.toLowerCase().indexOf(needle)
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  )
}

export function UpdateCard({
  update,
  tone,
  query,
  onOpen,
}: {
  update: Update
  tone: string
  query: string
  onOpen: (id: string) => void
}) {
  const items = update.items
  const visible = items.slice(0, PREVIEW_LIMIT)
  const hidden = items.length - visible.length
  const fresh = isFresh(update.date, 4)
  const isCommit = update.type === 'commit'
  const hasRelease = Boolean(update.release)

  return (
    <article
      className={`update${isCommit ? ' update--commit' : ''}`}
      style={{ ['--tone' as string]: tone }}
      onClick={() => onOpen(update.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(update.id)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`查看 ${update.repo} ${update.version ?? update.sha ?? ''} 的完整信息`}
    >
      <span className="update__scan" aria-hidden="true" />

      <header className="update__head">
        <span className="update__repo">
          <i className="update__repo-dot" />
          {update.repo}
        </span>

        {update.version ? (
          <span className="update__version">
            {!isCommit ? <span className="update__version-prefix">v</span> : null}
            {highlight(update.version, query)}
          </span>
        ) : null}

        {fresh ? (
          <span className="update__fresh">
            <i className="update__fresh-dot" />
            New
          </span>
        ) : null}

        <time className="update__date">{shortDate(update.date)}</time>
      </header>

      {update.notes.length > 0 ? (
        <div className="update__notes">
          {update.notes.map((note, index) => (
            <p key={index}>{highlight(note, query)}</p>
          ))}
        </div>
      ) : null}

      {isCommit ? (
        <p className="update__commit-title" style={{ marginTop: 10 }}>
          {items[0]?.module ? (
            <span className="update__module">{highlight(items[0].module, query)}</span>
          ) : null}
          {highlight(items[0]?.text ?? '', query)}
        </p>
      ) : (
        <ul className="update__items">
          {visible.map((item, index) => {
            const Icon = KIND_ICON[item.kind]
            return (
              <li className={`update__item update__item--${item.kind}`} key={index}>
                <span className="update__item-icon">
                  <Icon size={13} />
                </span>
                <span>
                  {item.module ? (
                    <span className="update__module">{highlight(item.module, query)}</span>
                  ) : null}
                  <span className="update__text">{highlight(item.text, query)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <footer className="update__foot">
        <span>{isCommit ? '提交记录' : `${items.length} 条改动`}</span>
        {update.sha ? <span className="update__sha">{update.sha}</span> : null}
        {hidden > 0 ? (
          <span className="update__peek">还有 {hidden} 条</span>
        ) : null}
        <span className="update__cta">
          {hasRelease ? '下载与详情' : '查看详情'}
          <IconArrowRight size={12} />
        </span>
      </footer>

    </article>
  )
}
