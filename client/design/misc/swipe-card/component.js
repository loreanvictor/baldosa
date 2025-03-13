import { define, useDispatch, onAttribute } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'

import '../../../util/swipe-control.js'


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

  const onswipe = ({ detail }) => {
    const width = holder.current.getBoundingClientRect().width
    const dx = detail.d.x

    holder.current.style.transition = 'none'
    holder.current.style.transform = `translateX(${dx}px)`
    left.current.style.transition = 'none'
    right.current.style.transition = 'none'
    left.current.style.opacity = Math.max(0, -dx / width * 2)
    right.current.style.opacity = Math.max(0, dx / width * 2)
  }

  const onrelease = ({ detail }) => {
    holder.current.style.transition = ''
    holder.current.style.transform = ''

    const dx = detail.d.x
    const width = holder.current.getBoundingClientRect().width

    if (detail.aligned && Math.abs(dx) > width * .4) {
      if (dx < 0) {
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
      } else if (dx > 0) {
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
  }

  // TODO: dissassociate inner card from swiping
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
    <swipe-control target=${holder} direction='horizontal'
      onswipe=${onswipe} onrelease=${onrelease}></swipe-control>
  `
})
