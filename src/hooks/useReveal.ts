import { useEffect } from 'react'

/**
 * 给带 .reveal 的元素做进入视口揭示，元素可用 data-reveal-delay 控制错峰。
 *
 * 用 IntersectionObserver 为主，另加一层 scroll 兜底：
 * 某些渲染环境下观察器可能不触发，兜底保证内容永远可见。
 */
export function useReveal(keys: unknown[] = []) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (nodes.length === 0) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const node of nodes) node.classList.add('is-in')
      return
    }

    const reveal = (node: HTMLElement) => {
      if (node.classList.contains('is-in')) return
      const delay = Number(node.dataset.revealDelay ?? 0)
      if (delay > 0) window.setTimeout(() => node.classList.add('is-in'), delay)
      else node.classList.add('is-in')
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          reveal(entry.target as HTMLElement)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )

    for (const node of nodes) {
      if (node.classList.contains('is-in')) continue
      observer.observe(node)
    }

    // 兜底：滚动时直接按几何位置判断
    let frame = 0
    const sweep = () => {
      frame = 0
      for (const node of nodes) {
        if (node.classList.contains('is-in')) continue
        const rect = node.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          reveal(node)
          observer.unobserve(node)
        }
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sweep)
    }

    sweep()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, keys)
}
