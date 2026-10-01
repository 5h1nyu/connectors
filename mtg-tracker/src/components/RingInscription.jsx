import { useId } from 'react'
import { RING_LINE } from '../lib/ringVerse'

// Circles of glowing Tengwar, like the inscription on The One Ring.
// rings: [{ r, fontSize, speed, band }]
//   r         radius in the SVG's own units (the SVG is size × size)
//   speed     seconds per full turn; negative turns the other way; 0 = still
//   repeat    how many times the verse goes round (more for bigger rings)
//   band      draw a gold band under the writing, like the ring itself
export default function RingInscription({ rings, size = 200, className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const c = size / 2
  return (
    <svg className={`ring-inscription ${className}`} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {rings.map((ring, i) => {
        const pathId = `${id}r${i}`
        const circumference = 2 * Math.PI * ring.r
        return (
          <g
            key={i}
            className={ring.speed ? 'ring-spin' : undefined}
            style={ring.speed ? { animationDuration: `${Math.abs(ring.speed)}s`, animationDirection: ring.speed < 0 ? 'reverse' : 'normal' } : undefined}
          >
            {ring.band && (
              <circle cx={c} cy={c} r={ring.r - ring.fontSize * 0.3} className="ring-band" strokeWidth={ring.fontSize * 1.9} fill="none" />
            )}
            <path id={pathId} fill="none" d={`M ${c} ${c - ring.r} a ${ring.r} ${ring.r} 0 1 1 -0.001 0`} />
            <text className="tengwar ring-text" fontSize={ring.fontSize}>
              <textPath href={`#${pathId}`} textLength={circumference * 0.995} lengthAdjust="spacing">
                {Array(ring.repeat ?? 1).fill(RING_LINE).join(' ⸱ ')}
              </textPath>
            </text>
          </g>
        )
      })}
    </svg>
  )
}
