import { useEffect, useState } from 'react'

export function useScrollProgress(): { progress: number; stuck: boolean } {
  const [state, setState] = useState({ progress: 0, stuck: false })

  useEffect(() => {
    let frame = 0
    const read = () => {
      frame = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      setState({ progress, stuck: window.scrollY > 12 })
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return state
}
