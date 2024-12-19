import { define, useDispatch } from 'https://esm.sh/minicomp'

import { observe } from '../util/observe.js'
import { slipperyValue } from '../util/slipper.js'


define('tap-zoom', ({ target, friction = 0.035 }) => {
  const onZoom = useDispatch('zoom')
  const onReset = useDispatch('reset')
  const zoom = slipperyValue((_, v) => onZoom(v), { friction: parseFloat(friction) })

  let dbltimer
  let zooming = false
  let zoomstart
  let last

  observe(target, 'touchstart', event => {
    if (event.touches.length === 1 && dbltimer) {
      event.preventDefault()
      zooming = true
      zoomstart = Date.now()
      dbltimer = undefined
      zoom.init(0)
      last = event.touches[0].clientY
    }
  }, { passive: false })

  observe(target, 'touchmove', event => {
    if (zooming) {
      event.preventDefault()

      const current = event.touches[0].clientY
      zoom.change(current - last)
      last = current
    }
  }, { passive: false })

  observe(target, 'touchend', event => {
    if (zooming) {
      event.preventDefault()

      if (Date.now() - zoomstart < 200 && (!zoom.velocity() || Math.abs(zoom.velocity()) < 0.001)) {
        onReset()
      }

      zoom.unlock()
      zooming = false
    } else {
      dbltimer = setTimeout(() => dbltimer = undefined, 200)
    }
  }, { passive: false })

  return ''
})