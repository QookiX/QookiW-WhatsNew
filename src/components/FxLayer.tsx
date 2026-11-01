import { useEffect, useRef } from 'react'

const HOT_SELECTOR =
  'a, button, input, label, .feature, .roster__row, .update__more, .seg__button, .rail__repo'

interface Dust {
  x: number
  y: number
  vy: number
  r: number
  a: number
  sp: number
  ph: number
  square: boolean
}

export function FxLayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const glowRef = useRef<HTMLDivElement | null>(null)
  const dotRef = useRef<HTMLSpanElement | null>(null)
  const ringRef = useRef<HTMLSpanElement | null>(null)

  // 光斑光标 + 热区检测 + 点击涟漪
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const glow = glowRef.current
    const dot = dotRef.current
    const ring = ringRef.current
    if (!glow || !dot || !ring) return

    const root = document.documentElement

    let armed = false
    let outside = true
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let glowX = targetX
    let glowY = targetY
    let dotX = targetX
    let dotY = targetY
    let frame = 0

    const tick = () => {
      glowX += (targetX - glowX) * 0.1
      glowY += (targetY - glowY) * 0.1
      dotX += (targetX - dotX) * 0.4
      dotY += (targetY - dotY) * 0.4
      glow.style.transform = `translate3d(${glowX.toFixed(1)}px, ${glowY.toFixed(1)}px, 0) translate(-50%, -50%)`
      const fast = `translate3d(${dotX.toFixed(1)}px, ${dotY.toFixed(1)}px, 0) translate(-50%, -50%)`
      dot.style.transform = fast
      ring.style.transform = fast
      frame = requestAnimationFrame(tick)
    }

    let hot = false
    const setHot = (next: boolean) => {
      if (next === hot) return
      hot = next
      root.classList.toggle('fx-hot', next)
    }

    const onMove = (event: PointerEvent) => {
      if (!armed) {
        armed = true
        root.classList.add('fx-pointer')
      }
      if (outside) {
        // 从窗口外回来：直接吸附到指针位置，不要从旧位置滑过来
        outside = false
        root.classList.remove('fx-out')
        glowX = event.clientX
        glowY = event.clientY
        dotX = event.clientX
        dotY = event.clientY
      }
      targetX = event.clientX
      targetY = event.clientY
      const target = event.target as HTMLElement | null
      setHot(Boolean(target?.closest?.(HOT_SELECTOR)))
    }

    const onLeave = () => {
      outside = true
      root.classList.add('fx-out')
      setHot(false)
    }

    const onDown = (event: PointerEvent) => {
      const ripple = document.createElement('span')
      ripple.className = 'fx-ripple'
      ripple.style.left = `${event.clientX}px`
      ripple.style.top = `${event.clientY}px`
      document.body.appendChild(ripple)
      window.setTimeout(() => ripple.remove(), 800)
    }

    frame = requestAnimationFrame(tick)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    window.addEventListener('blur', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('blur', onLeave)
      root.classList.remove('fx-pointer', 'fx-hot', 'fx-out')
    }
  }, [])

  // 烘焙碎屑粒子
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0
    let dust: Dust[] = []
    const pointer = { x: -9999, y: -9999 }

    const spawn = (initial: boolean): Dust => ({
      x: Math.random() * width,
      y: initial ? Math.random() * height : height + 16,
      vy: -(0.1 + Math.random() * 0.5),
      r: 0.6 + Math.random() * 1.8,
      a: 0.14 + Math.random() * 0.46,
      sp: 0.35 + Math.random() * 1.3,
      ph: Math.random() * Math.PI * 2,
      square: Math.random() > 0.62,
    })

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(110, Math.max(34, width / 15)))
      dust = Array.from({ length: count }, () => spawn(true))
    }

    resize()

    let time = 0
    let frame = 0

    const draw = () => {
      time += 0.016
      ctx.clearRect(0, 0, width, height)

      for (const p of dust) {
        p.y += p.vy
        p.x += Math.sin(time * p.sp + p.ph) * 0.32

        const dx = p.x - pointer.x
        const dy = p.y - pointer.y
        const dist2 = dx * dx + dy * dy
        if (dist2 < 30000) {
          const force = (1 - dist2 / 30000) * 0.85
          const dist = Math.sqrt(dist2) || 1
          p.x += (dx / dist) * force
          p.y += (dy / dist) * force
        }

        if (p.y < -20 || p.x < -24 || p.x > width + 24) {
          Object.assign(p, spawn(false))
        }

        const twinkle = 0.5 + 0.5 * Math.sin(time * 2.1 + p.ph)
        ctx.globalAlpha = p.a * twinkle
        ctx.fillStyle = '#f2cd9a'

        if (p.square) {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(time * p.sp + p.ph)
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2)
          ctx.restore()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.globalAlpha = 1
      frame = requestAnimationFrame(draw)
    }

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
    }

    const onLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
    }

    draw()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />
      <div ref={glowRef} className="fx-glow" aria-hidden="true" />
      <span ref={ringRef} className="fx-ring" aria-hidden="true">
        <i />
      </span>
      <span ref={dotRef} className="fx-dot" aria-hidden="true" />
      <div className="fx-rail fx-rail--l" aria-hidden="true">
        <span>
          QOOKIX ORG · UPDATE FEED · CHANGELOG STREAM · COMMIT LOG · QOOKIX ORG · UPDATE
          FEED · CHANGELOG STREAM · COMMIT LOG ·{' '}
        </span>
      </div>
      <div className="fx-rail fx-rail--r" aria-hidden="true">
        <span>
          REPOSITORIES · RELEASES · COMMITS · STARS · FRESH FROM THE OVEN · REPOSITORIES ·
          RELEASES · COMMITS · STARS · FRESH FROM THE OVEN ·{' '}
        </span>
      </div>
      <div className="fx-halo" aria-hidden="true" />
      <div className="fx-vignette" aria-hidden="true" />
      <div className="fx-scan" aria-hidden="true" />
    </>
  )
}
