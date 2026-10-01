// The deck-stack animation: a riffle shuffle that ends in a fan, done with the Web Animations API
// so every card gets its own slightly random path and timing (that's what makes it feel by-hand).

const rand = (min, max) => min + Math.random() * (max - min)
const SETTLE = 'cubic-bezier(.22,.9,.32,1)' // fast start, soft landing
const FALL = 'cubic-bezier(.55,0,.85,.35)' // speeds up as it drops back in
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const rest = (depth) => `translate3d(${depth * 3}px, ${-depth * 3}px, ${-depth * 6}px) rotate(0deg)`
const fan = (pos, overshoot = 1) =>
  `translate3d(${pos * 22 * overshoot}%, ${pos * pos * 2.5}%, ${pos * 2}px) rotate(${pos * 8 * overshoot}deg)`

// Start every animation from wherever the card is right now, so interrupting never jumps.
function animate(card, keyframes, options) {
  const from = getComputedStyle(card).transform
  card.getAnimations().forEach((a) => a.cancel())
  return card.animate([{ transform: from === 'none' ? rest(0) : from, offset: 0 }, ...keyframes], { fill: 'forwards', ...options })
}

function cardsOf(stack) {
  return [...stack.querySelectorAll('.stack-card')].map((el) => ({
    el,
    pos: Number(el.dataset.pos),
    depth: Number(el.dataset.depth),
  }))
}

export function shuffleAndFan(stack) {
  if (!stack) return
  clearTimeout(stack.revealTimer)
  const cards = cardsOf(stack)
  const n = cards.length
  if (n < 2 || reducedMotion()) {
    cards.forEach((c) => animate(c.el, [{ transform: fan(c.pos) }], { duration: 1 }))
    stack.classList.add('revealed')
    return
  }

  // Split: the top half lifts off to the right, the bottom half to the left.
  const topHalf = cards.slice(Math.floor(n / 2))
  const bottomHalf = cards.slice(0, Math.floor(n / 2))
  const plan = new Map()
  cards.forEach((c, i) => {
    const side = topHalf.includes(c) ? 1 : -1
    const splitStart = i * rand(18, 30)
    plan.set(c, {
      splitStart,
      splitEnd: splitStart + rand(220, 300),
      split: `translate3d(${side * rand(40, 56)}%, ${rand(-10, -4)}%, ${-c.depth * 6 + rand(4, 10)}px) rotate(${side * rand(5, 12)}deg)`,
    })
  })

  // Riffle: cards fall back in one at a time, alternating sides, bottom first, landing slightly messy.
  const order = []
  for (let k = 0; k < Math.max(topHalf.length, bottomHalf.length); k++) {
    if (bottomHalf[k]) order.push(bottomHalf[k])
    if (topHalf[k]) order.push(topHalf[k])
  }
  const dropFrom = Math.max(...[...plan.values()].map((p) => p.splitEnd)) + 40
  order.forEach((c, k) => {
    const p = plan.get(c)
    p.dropStart = dropFrom + k * rand(48, 70)
    p.dropEnd = p.dropStart + rand(130, 170)
    p.landed = `translate3d(${c.depth * 3 + rand(-3, 3)}px, ${-c.depth * 3 + rand(-2, 2)}px, ${-c.depth * 6}px) rotate(${rand(-2.5, 2.5)}deg)`
  })

  // Fan: spring out from the middle with a little overshoot.
  const fanFrom = Math.max(...[...plan.values()].map((p) => p.dropEnd)) + 60
  cards.forEach((c) => {
    const p = plan.get(c)
    p.fanStart = fanFrom + Math.abs(c.pos) * 35 + rand(0, 20)
    p.fanEnd = p.fanStart + rand(420, 520)
  })
  const total = Math.max(...[...plan.values()].map((p) => p.fanEnd))

  for (const c of cards) {
    const p = plan.get(c)
    const at = (ms) => ms / total
    animate(
      c.el,
      [
        { transform: rest(c.depth), offset: at(p.splitStart), easing: SETTLE },
        { transform: p.split, offset: at(p.splitEnd) },
        { transform: p.split, offset: at(p.dropStart), easing: FALL },
        { transform: p.landed, offset: at(p.dropEnd) },
        { transform: p.landed, offset: at(p.fanStart), easing: SETTLE },
        { transform: fan(c.pos, 1.08), offset: at(p.fanStart + (p.fanEnd - p.fanStart) * 0.6), easing: 'ease-in-out' },
        { transform: fan(c.pos), offset: 1 },
      ],
      { duration: total },
    )
  }
  // The cards turn face up while they're being riffled back in.
  stack.revealTimer = setTimeout(() => stack.classList.add('revealed'), dropFrom)
}

// Mouse left: gather the cards back into a neat stack, top card last.
export function gather(stack) {
  if (!stack) return
  clearTimeout(stack.revealTimer)
  const cards = cardsOf(stack)
  cards.forEach((c, i) =>
    animate(c.el, [{ transform: rest(c.depth) }], {
      duration: reducedMotion() ? 1 : rand(320, 420),
      delay: reducedMotion() ? 0 : (cards.length - 1 - i) * 25,
      easing: SETTLE,
    }),
  )
  stack.revealTimer = setTimeout(() => stack.classList.remove('revealed'), 140)
}
