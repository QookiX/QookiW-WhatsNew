#!/usr/bin/env node
/**
 * 判断本次 sync 的产物和仓库里的快照是否有实质差异。
 *
 * 只比较 repos 与 updates，忽略 generatedAt（每次抓取都会变）。
 * 退出码：0 = 没有变化，1 = 有变化。
 */

import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const TARGET = 'public/data/updates.json'

function normalize(raw) {
  const data = JSON.parse(raw)
  return JSON.stringify({ repos: data.repos, updates: data.updates })
}

let previous
try {
  previous = execFileSync('git', ['show', `HEAD:${TARGET}`], { encoding: 'utf8' })
} catch {
  console.log('[diff] 仓库里还没有快照，视为有变化')
  process.exit(1)
}

const current = await readFile(TARGET, 'utf8')

if (normalize(previous) === normalize(current)) {
  console.log('[diff] 数据没有变化')
  process.exit(0)
}

console.log('[diff] 数据有变化')
process.exit(1)
