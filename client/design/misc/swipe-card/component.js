import { define, useDispatch, onAttribute } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'

import { observe } from '../../../util/observe.js'


define('swipe-card', () => {
  const holder = ref()
  const left = ref()
  const right = ref()

  const action = useDispatch('action')
  const swipeleft = useDispatch('swipeleft')
  const swiperight = useDispatch('swiperight')
  const swipe = useDispatch('swipe')

  let leftresponse = 'sticky'
  let rightresponse = 'sticky'

  onAttribute('left', v => leftresponse = v)
  onAttribute('right', v => rightresponse = v)

  let sx, sy
  let dragging = false
  let draglock = false
  observe(holder, 'touchstart', event => {
    sx = event.touches[0].clientX
    sy = event.touches[0].clientY
    dragging = true
    holder.current.style.transition = 'none'
  }, { passive: true })
  observe(holder, 'touchmove', event => {
    const dx = event.touches[0].clientX - sx
    const dy = event.touches[0].clientY - sy
    dragging && (draglock || Math.abs(dx) > Math.abs(dy)) && event.preventDefault()    
  })
  observe(document, 'touchmove', event => {
    if (!dragging) return

    const width = holder.current.getBoundingClientRect().width
    const dx = event.touches[0].clientX - sx
    const dy = event.touches[0].clientY - sy

    if ((Math.abs(dy) < Math.abs(dx)) || draglock) {
      draglock = dx > 50 || draglock
      holder.current.style.transform = `translateX(${dx}px)`
      left.current.style.transition = 'none'
      right.current.style.transition = 'none'
      left.current.style.opacity = Math.max(0, -dx / width * 3)
      right.current.style.opacity = Math.max(0, dx / width * 3)
    }
  }, { passive: true })
  observe(document, 'touchend', event => {
    if (!dragging) return

    dragging = false
    draglock = false
    const width = holder.current.getBoundingClientRect().width
    const dx = event.changedTouches[0].clientX - sx
    const dy = event.changedTouches[0].clientY - sy
    holder.current.style.transition = ''
    holder.current.style.transform = ''

    if (Math.abs(dy) < Math.abs(dx)) {
      if (dx < -width / 3) {
        if (leftresponse === 'slide') {
          holder.current.style.transform = `translateX(${-width}px)`
          holder.current.style.opacity = 0
          holder.current.addEventListener('transitionend', () => {
            left.current.style = ''
            right.current.style = ''
            swipeleft()
            swipe(dx)
          }, { once: true })
        } else {
          left.current.style = ''
          right.current.style = ''
          swipeleft()
          swipe(dx)
        }
      } else if (dx > width / 3) {
        if (rightresponse === 'slide') {
          holder.current.style.transform = `translateX(${width}px)`
          holder.current.style.opacity = 0
  
          holder.current.addEventListener('transitionend', () => {
            left.current.style = ''
            right.current.style = ''
            swiperight()
            swipe(dx)
          }, { once: true })
        } else {
          left.current.style = ''
          right.current.style = ''
          swiperight()
          swipe(dx)
        }
      }
    } else {
      left.current.style = ''
      right.current.style = ''
    }
  }, { passive: true })

  return html`
    <style>:host { display: none }</style>
    <link rel="stylesheet" href="./client/design/misc/swipe-card/styles.css" />
    <div class='left' ref=${left}><slot name='left'></slot></div>
    <div class='right' ref=${right}><slot name='right'></slot></div>
    <div class='holder' ref=${holder}>
      <div class='image' onclick=${() => action()}>
        <slot name='image'></slot>
      </div>
      <div class='content' onclick=${() => action()}>
        <slot></slot>
      </div>
      <div class='actions'>
        <slot name='actions'></slot>
      </div>
    </div>
  `
})
