import { useEffect } from 'react'

/** 给带 .reveal 的元素做进入视口揭示，元素可用 data-reveal-delay 控制错峰。 */
export function useReveal(keys: unknown[] = []) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (nodes.length === 0) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const node of nodes) node.classList.add('is-in')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const node = entry.target as HTMLElement
          const delay = Number(node.dataset.revealDelay ?? 0)
          if (delay > 0) window.setTimeout(() => node.classList.add('is-in'), delay)
          else node.classList.add('is-in')
          observer.unobserve(node)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )

    for (const node of nodes) {
      if (node.classList.contains('is-in')) continue
      observer.observe(node)
    }

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, keys)
}
