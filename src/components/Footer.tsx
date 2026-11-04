import type { Snapshot } from '../lib/types'
import { SectionHead } from './SectionHead'
import { IconArrowUpRight, IconGithub } from './Icons'

function formatStamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

export function AboutSection({ data }: { data: Snapshot }) {
  const changelogRepos = data.repos.filter((repo) => repo.source === 'changelog')
  const commitRepos = data.repos.filter((repo) => repo.source === 'commits')

  return (
    <section className="section section--tight" id="about">
      <div className="shell">
        <SectionHead index="03" label="数据说明" title="这炉东西是怎么烤出来的" />

        <div className="about reveal" data-reveal-delay="90">
          <p className="about__body">
            页面上的每一条都来自 GitHub 上的真实记录：<strong>{changelogRepos.length}</strong> 个仓库
            直接读取仓库根目录的 <strong>CHANGELOG.md</strong>，解析出每个版本号、发布日期与逐条改动；
            余下 <strong>{commitRepos.length}</strong> 个没有 changelog 的仓库，则回退到最近
            <strong> 30 条提交</strong>。所有内容在构建时抓取成一份静态快照，
            页面本身不调用任何接口，所以打开就是全部，没有加载圈。
          </p>

          <dl className="about__facts">
            <div className="about__fact">
              <dt>Source</dt>
              <dd>GitHub REST API v3 + raw.githubusercontent.com</dd>
            </div>
            <div className="about__fact">
              <dt>Changelog</dt>
              <dd>{changelogRepos.map((repo) => repo.name).join(' · ') || '暂无'}</dd>
            </div>
            <div className="about__fact">
              <dt>Fallback</dt>
              <dd>提交记录（每仓库最近 30 条，含提交说明正文首段）</dd>
            </div>
            <div className="about__fact">
              <dt>Snapshot</dt>
              <dd className="mono">{formatStamp(data.generatedAt)}</dd>
            </div>
            <div className="about__fact">
              <dt>Refresh</dt>
              <dd className="mono">npm run sync</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}

export function Footer({ data }: { data: Snapshot }) {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__inner reveal reveal--fade">
          <div className="footer__brand">
            <p className="footer__wordmark">QookiX · 出炉日志</p>
            <p className="footer__note">
              一个只做一件事的小站：把 QookiX 组织下的仓库更新摊平、排好、端上来。
              内容以仓库本身为准，这里只是另一个视角。
            </p>

            <div className="footer__team">
              <a href="https://github.com/ZhaYi-Miao" target="_blank" rel="noreferrer">
                <img src="./brand/member-zayi.png" alt="" width={22} height={22} />
                ZhaYi
              </a>
              <a href="https://github.com/weimosheng" target="_blank" rel="noreferrer">
                <img src="./brand/member-weimosheng.png" alt="" width={22} height={22} />
                维墨笙
              </a>
            </div>
          </div>

          <div className="footer__links">
            <div>
              <p className="footer__col-title">Links</p>
              <a
                className="footer__link"
                href={`https://github.com/${data.org}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <IconGithub size={13} />
                GitHub 组织
              </a>
              {data.repos.slice(0, 2).map((repo) => (
                <a
                  className="footer__link"
                  key={repo.name}
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {repo.name}
                </a>
              ))}
            </div>

            <div>
              <p className="footer__col-title">Sections</p>
              <a className="footer__link" href="#lab">
                仓库总览
              </a>
              <a className="footer__link" href="#stream">
                更新流
              </a>
              <a className="footer__link" href="#about">
                数据说明
              </a>
            </div>

            <div>
              <p className="footer__col-title">Elsewhere</p>
              <a
                className="footer__link"
                href={`https://github.com/${data.org}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                组织主页
                <IconArrowUpRight size={12} />
              </a>
              <a
                className="footer__link"
                href={`${(data.repos.find((repo) => repo.source === 'changelog') ?? data.repos[0])?.htmlUrl ?? 'https://github.com'}/issues`}
                target="_blank"
                rel="noreferrer"
              >
                问题反馈
              </a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} QookiX</span>
          <span>Snapshot built {formatStamp(data.generatedAt)}</span>
        </div>

        <p className="footer__credit">
          本网页完全由 <b>DeepSeek V4.1 Flash</b>、<b>MiniMax M3.1 Flash</b>、
          <b>GLM 5.3 Flash</b>、<b>HY4</b> 开发
        </p>
      </div>

      <div className="footer__mega" aria-hidden="true">
        <span>QOOKIX</span>
      </div>
    </footer>
  )
}
