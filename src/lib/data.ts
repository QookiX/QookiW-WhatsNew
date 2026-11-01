import type { Snapshot } from './types'

const SNAPSHOT_URL = `${import.meta.env.BASE_URL}data/updates.json`

export async function loadSnapshot(): Promise<Snapshot> {
  const res = await fetch(SNAPSHOT_URL, { cache: 'no-cache' })
  if (!res.ok) {
    throw new Error(`数据快照加载失败（${res.status}）。请先执行 npm run sync 生成 public/data/updates.json`)
  }
  const data = (await res.json()) as Snapshot
  if (!Array.isArray(data.repos) || !Array.isArray(data.updates)) {
    throw new Error('数据快照格式不正确')
  }
  return data
}
