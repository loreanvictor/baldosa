import { define, onAttribute, useDispatch } from 'https://esm.sh/minicomp'

import { observe } from './observe.js'


define('swipe-control', ({ target, nopropagate = true }) => {
  const swipestart = useDispatch('start')
  const swipe = useDispatch('swipe')
  const release = useDispatch('release')

  let direction = 'horizontal'
  onAttribute('direction', d => (direction = d))

  const aligned = d =>
    direction === 'horizontal' ? Math.abs(d.x) > Math.abs(d.y) : Math.abs(d.y) > Math.abs(d.x)
  const project = d => direction === 'horizontal' ? d.x : d.y

  const start = { x: 0, y: 0 }
  const last = { x: 0, y: 0 }
  const velocity = { x: 0, y : 0 }

  let swiping = false
  let locked = false

  observe(target, 'touchstart', event => {
    swiping = true
    start.x = event.touches[0].clientX
    start.y = event.touches[0].clientY
    last.x = start.x
    last.y = start.y

    swipestart({ start, disqualify: () => swiping = false })
  }, { passive: true })

  observe(document, 'touchmove', event => {
    if (swiping) {
      const curr = { x: event.touches[0].clientX, y: event.touches[0].clientY }
      const d = { x: curr.x - start.x, y: curr.y - start.y }
      
      velocity.x = curr.x - last.x
      velocity.y = curr.y - last.y
      last.x = curr.x
      last.y = curr.y

      if (aligned(d) || locked) {
        locked = locked || project(d) > 50
        swipe({ start, velocity, d, locked })
      }
    }
  }, { passive: true })

  observe(document, 'touchend', event => {
    if (swiping) {
      const l = locked
      locked = false
      swiping = false

      const curr = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
      const d = { x: curr.x - start.x, y: curr.y - start.y }

      release({ start, velocity, d, aligned: aligned(d), locked: l })
    }
  }, { passive: true })

  if (nopropagate) {
    observe(target, 'touchmove', event => {
      const d = {
        x: event.touches[0].clientX - start.x,
        y: event.touches[0].clientY - start.y,
      }

      swiping && aligned(d) && event.preventDefault()
    }, { passive: false })
  }

  return ''
})
