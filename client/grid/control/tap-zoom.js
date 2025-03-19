import { define, useDispatch } from 'minicomp'

import { observe } from '../../util/observe.js'
import { slipperyValue } from '../util/slipper.js'


define('tap-zoom', ({ target, friction = 0.035 }) => {
  const onZoom = useDispatch('zoom')
  const onReset = useDispatch('reset')
  const zoom = slipperyValue((_, v) => onZoom(v), { friction: parseFloat(friction) })

  let dbltimer
  let zooming = false
  let zoomstart
  let touchstart
  let last

  observe(target, 'touchstart', event => {
    touchstart = { x: event.touches[0].clientX, y: event.touches[0].clientY }
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
      const touchend = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
      const dx = touchend.x - touchstart.x
      const dy = touchend.y - touchstart.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 10) {
        dbltimer = setTimeout(() => dbltimer = undefined, 200) 
      }
    }
  }, { passive: false })

  return ''
})