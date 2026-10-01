import { useCallback, useRef } from 'react'

// Makes an element lean towards the mouse in 3D, with a light glare that follows the pointer.
// It writes CSS variables (--rx, --ry, --gx, --gy) straight onto the element, so nothing re-renders.
export function useTilt(maxDegrees = 10) {
  const ref = useRef(null)

  const onPointerMove = useCallback(
    (e) => {
      const el = ref.current
      if (!el || e.pointerType !== 'mouse') return
      const box = el.getBoundingClientRect()
      const x = (e.clientX - box.left) / box.width // 0 = left edge, 1 = right edge
      const y = (e.clientY - box.top) / box.height
      el.style.setProperty('--ry', `${(x - 0.5) * 2 * maxDegrees}deg`)
      el.style.setProperty('--rx', `${(0.5 - y) * 2 * maxDegrees}deg`)
      el.style.setProperty('--gx', `${x * 100}%`)
      el.style.setProperty('--gy', `${y * 100}%`)
    },
    [maxDegrees],
  )

  const onPointerLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }, [])

  return { ref, onPointerMove, onPointerLeave }
}
