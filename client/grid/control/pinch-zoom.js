import { define, useDispatch } from 'minicomp'

import { observe } from '../../util/observe.js'
import { slipperyValue } from '../util/slipper.js'


define('pinch-zoom', ({ target, friction = 0.035 }) => {
  const onZoom = useDispatch('zoom')
  const zoom = slipperyValue((_, v) => onZoom(v), { friction: parseFloat(friction) })

  const dist = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))
  const touchPoint = touch => ({ x: touch.clientX, y: touch.clientY })

  let zooming = false
  let last = undefined

  observe(target, 'touchstart', event => {
    if (event.touches.length === 2 && !zooming) {
      event.preventDefault()
      zooming = true
      zoom.init(0)
      last = dist(touchPoint(event.touches[0]), touchPoint(event.touches[1]))
    }
  }, { passive: false })

  observe(target, 'touchmove', event => {
    if (zooming) {
      event.preventDefault()

      const current = dist(touchPoint(event.touches[0]), touchPoint(event.touches[1]))
      zoom.change(current - last)
      last = current
    }
  }, { passive: false })

  observe(target, 'touchend', event => {
    if (zooming) {
      event.preventDefault()
      zoom.unlock()
      zooming = false
    }
  }, { passive: false })

  return ''  
})
