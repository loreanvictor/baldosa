import { define, useDispatch } from 'https://esm.sh/minicomp'

import { observe } from '../util/observe.js'
import { slipperyVector } from '../util/slipper.js'


define('touch-pan', ({ target, friction = 0.035 }) => {
  const onPan = useDispatch('pan')
  
  let panning = false
  let last = undefined
  let dbltimer

  const motion = slipperyVector((_, v) => onPan(v), { friction: parseFloat(friction) })

  observe(target, 'touchstart', event => {
    if (event.touches.length === 1 && !dbltimer) {
      event.preventDefault()
      panning = true
      last = { x: event.touches[0].clientX, y: event.touches[0].clientY }
      motion.init({ x: 0, y: 0 })
    }
  }, { passive: false })

  observe(target, 'touchmove', event => {
    if (panning) {
      event.preventDefault()

      const current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
      motion.change({ x: last.x - current.x, y: last.y - current.y })
      last = current
    }
  }, { passive: false })

  observe(target, 'touchend', () => {
    if (panning) {
      panning = false
      motion.unlock()
    }

    dbltimer = setTimeout(() => dbltimer = undefined, 200)
  }, { passive: false })

  return ''
})
