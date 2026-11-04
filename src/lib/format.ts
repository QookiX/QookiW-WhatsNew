const MS_DAY = 86_400_000

export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  // 纯日期（YYYY-MM-DD）按本地时区解析。
  // new Date('2026-11-04') 会被规范当成 UTC 午夜，在负时区会退成前一天。
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (plain) {
    return new Date(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3]))
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 2026-10-31T10:17:16Z -> 2026-10-31 */
export function isoDay(value: string | null | undefined): string {
  const date = toDate(value)
  if (!date) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function shortDate(value: string | null | undefined): string {
  const date = toDate(value)
  if (!date) return '未标注日期'
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}

export function monthKey(value: string | null | undefined): string {
  const date = toDate(value)
  if (!date) return 'unknown'
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function monthLabel(key: string): string {
  if (key === 'unknown') return '日期未知'
  const [year, month] = key.split('-')
  return `${year} 年 ${Number(month)} 月`
}

export function relativeTime(value: string | null | undefined): string {
  const date = toDate(value)
  if (!date) return '未知'
  const diff = Date.now() - date.getTime()
  if (diff < 0) return '刚刚'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(diff / MS_DAY)
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} 个月前`
  return `${Math.floor(months / 12)} 年前`
}

export function isFresh(value: string | null | undefined, days = 7): boolean {
  const date = toDate(value)
  if (!date) return false
  return Date.now() - date.getTime() < days * MS_DAY
}

export function compactNumber(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `${Math.round(n / 1000)}k`
}
