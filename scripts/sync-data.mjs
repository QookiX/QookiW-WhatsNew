#!/usr/bin/env node
/**
 * 抓取 QookiX 组织的仓库更新，生成 public/data/updates.json。
 *
 * 数据来源优先级：
 *   1. 仓库根目录 / docs 下的 CHANGELOG.md（两个 Launcher 都有）
 *   2. 没有 changelog 时回退到 commits 记录
 *
 * 用法：
 *   node scripts/sync-data.mjs          常规同步
 *   node scripts/sync-data.mjs --full   忽略本地快照，全量重抓
 *
 * 可选环境变量：GITHUB_TOKEN（提高 API 额度）
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ORG = 'QookiX'
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/updates.json')
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
const COMMITS_PER_REPO = 30
const MAX_ITEMS_PER_ENTRY = 400

const CHANGELOG_CANDIDATES = ['CHANGELOG.md', 'changelog.md', 'docs/CHANGELOG.md', 'CHANGELOG.zh.md']

const SKIP_REPOS = new Set(['.github'])

const LANG_COLORS = {
  Kotlin: '#E8BC83',
  Rust: '#DDA45F',
  TypeScript: '#C9813E',
  Vue: '#B96F35',
  Go: '#A0562A',
  HTML: '#DDB46B',
  'C#': '#8A4520',
  JavaScript: '#E0A751',
}

// 同一个仓库固定一个「烘烤色」，避免每次构建抖动
const BISCUIT_TONES = [
  '#F0C98A',
  '#E3A863',
  '#D08A45',
  '#B96F35',
  '#A0562A',
  '#8A4520',
  '#C99A4E',
  '#DDB46B',
  '#BF7333',
]

const apiHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'qookix-whatsnew',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
}

async function api(path, { allowFail = false } = {}) {
  const res = await fetch(`https://api.github.com${path}`, { headers: apiHeaders })
  if (!res.ok) {
    if (allowFail) return null
    throw new Error(`GitHub API ${path} -> ${res.status} ${res.statusText}`)
  }
  return res.json()
}

async function rawFile(fullName, branch, path) {
  const res = await fetch(
    `https://raw.githubusercontent.com/${fullName}/${branch}/${path}?t=${Date.now()}`,
    { headers: { 'User-Agent': 'qookix-whatsnew' } },
  )
  if (!res.ok) return null
  return res.text()
}

/** 并发受限的 map */
async function pool(items, limit, worker) {
  const results = new Array(items.length)
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index], index)
    }
  })
  await Promise.all(runners)
  return results
}

const KIND_RULES = [
  { kind: 'fix', re: /(修复|修掉|修正|解决|fix)/i },
  { kind: 'feat', re: /(新增|加入|添加|支持|引入|add|feat)/i },
  { kind: 'wip', re: /(优化|改进|调整|重构|提升|改为|改成|统一|improve|refactor|perf)/i },
  { kind: 'drop', re: /(移除|删除|去掉|弃用|remove|drop)/i },
]

function classify(text) {
  for (const rule of KIND_RULES) {
    if (rule.re.test(text)) return rule.kind
  }
  return 'other'
}

function cleanInline(text) {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

/**
 * 解析 CHANGELOG.md：
 *   ## [0.17.0] - 2026-10-26
 *   > 可选的引用说明
 *   0. **模块**：说明
 *   ### 已知问题
 */
function parseChangelog(markdown, repoName) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const releases = []
  let current = null
  let section = ''
  let inHtmlComment = false

  const push = () => {
    if (!current) return
    if (current.version && current.items.length + current.notes.length > 0) {
      releases.push(current)
    }
    current = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (trimmed.startsWith('<!--')) {
      inHtmlComment = !trimmed.includes('-->')
      continue
    }
    if (inHtmlComment) {
      if (trimmed.includes('-->')) inHtmlComment = false
      continue
    }

    const heading = /^##\s+\[?([^\]]+?)\]?\s*(?:[-–—]\s*(\d{4}-\d{2}-\d{2}))?\s*$/.exec(trimmed)
    if (heading) {
      push()
      const version = heading[1].trim()
      if (/^unreleased$/i.test(version)) continue
      current = {
        id: `${repoName}:${version}`,
        repo: repoName,
        type: 'release',
        version: version.replace(/^v/i, ''),
        date: heading[2] || null,
        changelogDate: heading[2] || null,
        notes: [],
        items: [],
        sections: [],
      }
      section = ''
      continue
    }

    if (!current) continue

    const sub = /^###\s+(.+)$/.exec(trimmed)
    if (sub) {
      section = cleanInline(sub[1])
      continue
    }

    if (!trimmed) continue

    const quote = /^>\s?(.*)$/.exec(trimmed)
    if (quote) {
      current.notes.push(cleanInline(quote[1]))
      continue
    }

    const item = /^(?:[-*+]|\d+[.)])\s+(.*)$/.exec(trimmed)
    if (item) {
      const body = item[1]
      const bold = /^\*\*(.+?)\*\*\s*[：:]\s*(.+)$/.exec(body)
      const module = bold ? cleanInline(bold[1]) : section || ''
      const text = cleanInline(bold ? bold[2] : body)
      if (!text) continue
      current.items.push({
        module,
        text,
        kind: classify(`${module} ${text}`),
        section: section || null,
      })
      continue
    }

    // 段落续行
    const last = current.items[current.items.length - 1]
    if (last) last.text = `${last.text} ${cleanInline(trimmed)}`.trim()
  }
  push()
  return releases
}

const COMMIT_NOISE = /^(Merge (branch|pull request)|chore\(release\)|v?\d+\.\d+\.\d+$)/i

const CONVENTIONAL = /^(\w+)(?:[([]([^\])]+)[)\]])?!?:\s*(.+)$/

const KIND_BY_TYPE = {
  feat: 'feat',
  feature: 'feat',
  fix: 'fix',
  bugfix: 'fix',
  hotfix: 'fix',
  perf: 'wip',
  refactor: 'wip',
  style: 'wip',
  improve: 'wip',
  revert: 'drop',
  remove: 'drop',
}

function parseCommits(commits, repoName) {
  return commits
    .filter((c) => !COMMIT_NOISE.test((c.commit?.message || '').split('\n')[0].trim()))
    .map((c) => {
      const message = c.commit?.message || ''
      const [rawTitle, ...rest] = message.split('\n')
      const title = rawTitle.trim()
      const bodyLines = rest
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 2)
      const conventional = CONVENTIONAL.exec(title)
      const module = conventional ? conventional[2] || conventional[1] : ''
      const text = conventional ? conventional[3] : title
      return {
        id: `${repoName}:commit:${c.sha}`,
        repo: repoName,
        type: 'commit',
        version: null,
        date: c.commit?.committer?.date || c.commit?.author?.date || null,
        sha: c.sha.slice(0, 7),
        url: c.html_url,
        notes: bodyLines.map((line) => cleanInline(line.replace(/^[-*+]\s+/, ''))),
        items: [
          {
            module: module ? cleanInline(module) : '',
            text: cleanInline(text),
            kind:
              (conventional && KIND_BY_TYPE[conventional[1].toLowerCase()]) ||
              classify(`${module} ${text}`),
            section: null,
          },
        ],
        sections: [],
      }
    })
}

async function buildRepo(repo, index) {
  const [owner, name] = repo.full_name.split('/')
  const branch = repo.default_branch || 'main'

  let releases = []
  let changelogText = null
  const changelogPathUsed = []

  for (const path of CHANGELOG_CANDIDATES) {
    const text = await rawFile(repo.full_name, branch, path)
    if (text && text.length > 40) {
      changelogText = text
      changelogPathUsed.push(path)
      break
    }
  }

  if (changelogText) {
    releases = parseChangelog(changelogText, name)
  }

  let commits = []
  let commitsOk = true
  if (!changelogText) {
    const data = await api(
      `/repos/${owner}/${name}/commits?sha=${encodeURIComponent(branch)}&per_page=${COMMITS_PER_REPO}`,
      { allowFail: true },
    )
    if (Array.isArray(data)) commits = parseCommits(data, name)
    else commitsOk = false
  }

  // tag -> release 详情映射（只有 changelog 仓库需要，省额度）
  const releaseMap = {}
  if (changelogText) {
    const releasesApi = await api(`/repos/${owner}/${name}/releases?per_page=100`, { allowFail: true })
    if (Array.isArray(releasesApi)) {
      for (const rel of releasesApi) {
        const record = {
          tag: rel.tag_name,
          url: rel.html_url,
          name: rel.name || rel.tag_name,
          publishedAt: rel.published_at,
          prerelease: Boolean(rel.prerelease),
          draft: Boolean(rel.draft),
          assets: (rel.assets || []).map((asset) => ({
            name: asset.name,
            size: asset.size,
            url: asset.browser_download_url,
            downloads: asset.download_count,
            type: asset.content_type,
          })),
        }
        releaseMap[rel.tag_name] = record
        releaseMap[rel.tag_name.replace(/^v/i, '')] = record
      }
    }
  }

  const entries = [...releases, ...commits]
  const changelogUrl = `${repo.html_url}/blob/${branch}/${changelogPathUsed[0] || 'CHANGELOG.md'}`
  for (const entry of entries) {
    if (entry.type !== 'release') continue
    const record = releaseMap[entry.version] || releaseMap[`v${entry.version}`] || null
    entry.release = record
    entry.url = record?.url || changelogUrl
    entry.changelogUrl = changelogUrl
    // 以 GitHub 上的真实发布时间为准（前端按浏览器时区渲染，与 GitHub 页面一致）；
    // CHANGELOG 里手写的日期只作兜底。
    if (record?.publishedAt) {
      entry.publishedAt = record.publishedAt
      entry.date = record.publishedAt
    }
  }

  const dated = entries.filter((e) => e.date).sort((a, b) => b.date.localeCompare(a.date))
  const undated = entries.filter((e) => !e.date)

  const latest = dated[0] || null

  return {
    repo: {
      name,
      fullName: repo.full_name,
      displayName: name,
      description: repo.description || '',
      language: repo.language || '',
      languageColor: LANG_COLORS[repo.language] || '#C99A4E',
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      openIssues: repo.open_issues_count ?? 0,
      topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 6) : [],
      htmlUrl: repo.html_url,
      homepage: repo.homepage || '',
      pushedAt: repo.pushed_at,
      createdAt: repo.created_at,
      archived: Boolean(repo.archived),
      source: changelogText ? 'changelog' : 'commits',
      changelogPath: changelogPathUsed[0] || null,
      tone: BISCUIT_TONES[index % BISCUIT_TONES.length],
      releaseCount: releases.length,
      latestVersion: latest?.version || null,
      latestDate: latest?.date || repo.pushed_at,
      updateCount: entries.length,
    },
    entries: [...dated, ...undated].slice(0, MAX_ITEMS_PER_ENTRY),
    ok: changelogText ? releases.length > 0 : commitsOk,
  }
}

async function reportToken() {
  const probe = await api('/rate_limit', { allowFail: true })
  const core = probe?.resources?.core

  if (!TOKEN) {
    console.log('[sync] 未配置 GITHUB_TOKEN · 使用匿名额度（60 次/小时）')
    return
  }
  if (!core) {
    console.log('[sync] 已设置 GITHUB_TOKEN，但额度查询失败')
    return
  }
  if (core.limit > 60) {
    console.log(`[sync] GITHUB_TOKEN 已生效 · 剩余额度 ${core.remaining}/${core.limit}`)
  } else {
    console.log(
      `[sync] 已设置 GITHUB_TOKEN 但额度仍是 ${core.limit}/小时 · 令牌可能无效或未授权`,
    )
  }
}

async function main() {
  const full = process.argv.includes('--full')
  const startedAt = Date.now()

  await reportToken()

  const existingRaw = await readFile(OUT, 'utf8').catch(() => null)
  let previous = null
  if (existingRaw) {
    try {
      previous = JSON.parse(existingRaw)
    } catch {
      previous = null
    }
  }

  if (!full && previous) {
    const age = Date.now() - new Date(previous.generatedAt).getTime()
    if (Number.isFinite(age) && age < 1000 * 60 * 5) {
      console.log('[sync] 快照仍在 5 分钟内，跳过抓取')
      return
    }
  }

  // 抓取失败（限速、网络）时沿用上一次快照里该仓库的数据，避免整块消失
  const previousByRepo = new Map()
  for (const entry of previous?.updates ?? []) {
    const list = previousByRepo.get(entry.repo)
    if (list) list.push(entry)
    else previousByRepo.set(entry.repo, [entry])
  }
  const previousMeta = new Map((previous?.repos ?? []).map((repo) => [repo.name, repo]))

  let repos
  try {
    repos = await api(`/orgs/${ORG}/repos?per_page=100&sort=pushed&direction=desc`)
  } catch (error) {
    if (previous?.repos?.length) {
      console.warn(`[sync] 仓库列表拉取失败（${error.message}），沿用现有快照，跳过本次同步`)
      return
    }
    throw new Error(
      `${error.message}\n提示：匿名调用 GitHub API 只有 60 次/小时，请设置 GITHUB_TOKEN 后重试`,
    )
  }
  const targets = repos
    .filter((r) => !SKIP_REPOS.has(r.name))
    .sort((a, b) => String(b.pushed_at).localeCompare(String(a.pushed_at)))

  console.log(`[sync] 找到 ${targets.length} 个仓库，开始抓取…`)

  const built = await pool(targets, 3, async (repo, index) => {
    let result
    try {
      result = await buildRepo(repo, index)
    } catch (error) {
      console.warn(`[sync]   ${repo.name} 失败：${error.message}`)
      result = {
        repo: {
          name: repo.name,
          fullName: repo.full_name,
          displayName: repo.name,
          description: repo.description || '',
          language: repo.language || '',
          languageColor: LANG_COLORS[repo.language] || '#C99A4E',
          stars: repo.stargazers_count ?? 0,
          forks: repo.forks_count ?? 0,
          openIssues: repo.open_issues_count ?? 0,
          topics: repo.topics || [],
          htmlUrl: repo.html_url,
          homepage: repo.homepage || '',
          pushedAt: repo.pushed_at,
          createdAt: repo.created_at,
          archived: Boolean(repo.archived),
          source: 'commits',
          changelogPath: null,
          tone: BISCUIT_TONES[index % BISCUIT_TONES.length],
          releaseCount: 0,
          latestVersion: null,
          latestDate: repo.pushed_at,
          updateCount: 0,
          failed: true,
        },
        entries: [],
        ok: false,
      }
    }

    if (!result.ok) {
      const saved = previousByRepo.get(repo.name)
      const savedMeta = previousMeta.get(repo.name)
      if (saved?.length) {
        result.entries = saved
        result.repo.updateCount = saved.length
        result.repo.releaseCount = savedMeta?.releaseCount ?? result.repo.releaseCount
        result.repo.latestVersion = savedMeta?.latestVersion ?? result.repo.latestVersion
        result.repo.latestDate = savedMeta?.latestDate ?? result.repo.latestDate
        result.repo.source = savedMeta?.source ?? result.repo.source
        result.repo.stale = true
      }
    }

    const flag = result.repo.stale ? ' · 沿用上次快照' : result.repo.failed ? ' · 无数据' : ''
    console.log(
      `[sync]   ${repo.name.padEnd(30)} ${result.repo.source.padEnd(9)} ${String(
        result.repo.updateCount,
      ).padStart(3)} 条${flag}`,
    )
    return result
  })

  const updates = built
    .flatMap((b) => b.entries)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))

  const payload = {
    org: ORG,
    generatedAt: new Date().toISOString(),
    repos: built.map((b) => b.repo),
    updates,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(
    `[sync] 完成：${payload.repos.length} 个仓库 / ${updates.length} 条更新 / ${seconds}s -> public/data/updates.json`,
  )
}

main().catch((error) => {
  console.error('[sync] 失败：', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
