import { define, useDispatch } from 'minicomp'

import { observe } from '../../util/observe.js'
import { slipperyValue } from '../util/slipper.js'


define('wheel-pan-zoom', ({ target, friction = 0.035 }) => {
  const onPan = useDispatch('pan')
  const onZoom = useDispatch('zoom')
  const zoom = slipperyValue((_, v) => onZoom(v), { friction: parseFloat(friction) })

  let zoomtimeout
  let pantimeout

  observe(target, 'wheel', event => {
    event.preventDefault()
    if (!event.ctrlKey && !event.metaKey) {
      onPan({ x: event.deltaX, y: event.deltaY })
      clearTimeout(pantimeout)
      pantimeout = setTimeout(() => onPan({ x: 0, y: 0 }), 50)
    } else {
      !zoom.locked() && zoom.init(0)
      zoom.change(-event.deltaY)
      clearTimeout(zoomtimeout)
      zoomtimeout = setTimeout(() => zoom.unlock(), 10)
    }
  }, { passive: false })

  return ''
})
