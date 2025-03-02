import { define, useDispatch } from 'https://esm.sh/minicomp'

import { observe } from '../../util/observe.js'
import { slipperyVector } from '../util/slipper.js'


define('drag-pan', ({ target, friction = 0.035 }) => {
  let drag = false

  const onPan = useDispatch('pan')

  const motion = slipperyVector((_, v) => onPan(v), { friction: parseFloat(friction) })

  observe(target, 'mousedown', () => {
    drag = true
    motion.init({x: 0, y: 0})
  })

  observe(window, 'mousemove', event => {
    if (drag) {
      motion.change({x: -event.movementX, y: -event.movementY})
    }
  })

  observe(window, 'mouseup', () => {
    drag = false
    motion.unlock()
  })

  return ''
})
