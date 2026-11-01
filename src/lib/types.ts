export type EntryKind = 'feat' | 'fix' | 'wip' | 'drop' | 'other'

export interface UpdateItem {
  module: string
  text: string
  kind: EntryKind
  section: string | null
}

export interface ReleaseAsset {
  name: string
  size: number
  url: string
  downloads: number
  type: string
}

export interface ReleaseInfo {
  tag: string
  url: string
  name: string
  publishedAt: string | null
  prerelease: boolean
  draft: boolean
  assets: ReleaseAsset[]
}

export interface Update {
  id: string
  repo: string
  type: 'release' | 'commit'
  version: string | null
  date: string | null
  sha?: string
  url?: string
  changelogUrl?: string
  release?: ReleaseInfo | null
  notes: string[]
  items: UpdateItem[]
}

export interface Repo {
  name: string
  fullName: string
  displayName: string
  description: string
  language: string
  languageColor: string
  stars: number
  forks: number
  openIssues: number
  topics: string[]
  htmlUrl: string
  homepage: string
  pushedAt: string
  createdAt: string
  archived: boolean
  source: 'changelog' | 'commits'
  changelogPath: string | null
  tone: string
  releaseCount: number
  latestVersion: string | null
  latestDate: string
  updateCount: number
  failed?: boolean
  stale?: boolean
}

export interface Snapshot {
  org: string
  generatedAt: string
  repos: Repo[]
  updates: Update[]
}
