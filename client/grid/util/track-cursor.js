import { define, useDispatch } from 'https://esm.sh/minicomp'

import { observe } from '../../util/observe.js'


define('track-cursor', () => {
  const onMove = useDispatch('move')

  observe(window, 'mousedown', event => {
    onMove({ x: event.clientX, y: event.clientY })
  })
  observe(window, 'touchstart', event => {
    onMove({ x: event.touches[0].clientX, y: event.touches[0].clientY })
  })
  observe(window, 'mousemove', event => {
    onMove({ x: event.clientX, y: event.clientY })
  })
  observe(window, 'touchmove', event => {
    onMove({ x: event.touches[0].clientX, y: event.touches[0].clientY })
  })
  observe(window, 'mouseup', event => {
    onMove({ x: event.clientX, y: event.clientY })
  })

  return ''
})
