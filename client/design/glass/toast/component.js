import { define, onAttribute, attachControls, useDispatch, currentNode } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'

import { observe } from '../../../util/observe.js'
import { constantly } from '../../../util/constantly.js'

import '../../close-pin/component.js'
import '../../misc/circle-progress/component.js'
import { push } from '../modal/context.js'


define('glass-toast', ({ time = 3_000 }) => {
  const self = currentNode()
  const onclose = useDispatch('close')

  const holder = ref()
  const progress = ref()
  let timeout
  let timer = 0

  onAttribute('time', t => {
    if (t) {
      time = t
      clearTimeout(timeout)
      timeout = setTimeout(() => controls.close(), time)
      timer = time
    }
  })

  constantly(() => {
    timer = Math.max(0, timer - 200)
    if (timer > 0) {
      progress.current.setAttribute('progress', 1 - timer / time)
    }
  }, p => setTimeout(p, 200))

  const controls = {
    open: () => {
      self.setAttribute('open', '')
      clearTimeout(timeout)
      holder.current.showPopover()
      timeout = setTimeout(() => controls.close(), time)
      timer = time
      push(self, false)
    },
    close: (dir) => {
      self.removeAttribute('open')
      onclose()
      timer = 0

      const width = holder.current.getBoundingClientRect().width
      !dir && holder.current.classList.add('closing')
      dir === 'right' && (holder.current.style.transform = `translateX(calc(25vw + ${width}px))`)
      dir === 'left' && (holder.current.style.transform = `translateX(calc(-25vw - ${width}px))`)
      dir && (holder.current.style.opacity = '0')
      holder.current.style.transition = ''

      setTimeout(() => {
        holder.current.classList.remove('closing')
        holder.current.style.transform = ''
        holder.current.style.opacity = ''
        clearTimeout(timeout)
        holder.current.hidePopover()
        progress.current.setAttribute('progress', 0)
      }, 150)
    }
  }

  attachControls(controls)

  let dragstart
  let lastpos
  let lastvel
  observe(holder, 'touchstart', event => {
    dragstart = [event.touches[0].clientX, event.touches[0].clientY]
    lastpos = event.touches[0].clientY
  }, { passive: true })
  observe(holder, 'touchmove', event => {
    event.stopPropagation()

    lastvel = event.touches[0].clientX - lastpos
    lastpos = event.touches[0].clientX
    const dx = lastpos - dragstart[0]

    holder.current.style.transition = 'none'
    holder.current.style.transform = `translateX(${dx}px)`
  }, { passive: true })
  observe(holder, 'touchend', () => {
    if (Math.abs(lastvel) > 5) {
      controls.close(lastvel > 5 ? 'right' : lastvel < -5 ? 'left' : undefined)
    } else {
      holder.current.style.transition = ''
      holder.current.style.transform = ''
    }
  }, { passive: true })

  return html`
    <link rel="stylesheet" href="./client/design/glass/toast/styles.css" />
    <output ref=${holder} popover='manual' onclick=${e => e.stopPropagation()}>
      <slot></slot>
      <circle-progress ref=${progress} progress="0"></circle-progress>
      <close-pin onclick=${() => controls.close()}></close-pin>
    </output>
  `
})
