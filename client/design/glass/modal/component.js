import { define, attachControls, useDispatch, currentNode } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import '../../close-pin/component.js'
import { observe } from '../../../util/observe.js'
import { push } from './context.js'


define('glass-modal', ({ noheader }) => {
  const self = currentNode()
  const onclose = useDispatch('close')
  const dialog = ref()
  let opened = false
  let warmup

  const controls = {
    open: () => {
      dialog.current.showModal()
      dialog.current.focus()
      clearTimeout(warmup)
      warmup = setTimeout(() => opened = true, 50)
      push(self)
    },
    close: () => {
      clearTimeout(warmup)
      opened = false
      onclose()

      dialog.current.classList.add('closing')

      const height = dialog.current.getBoundingClientRect().height
      window.innerWidth < 512 && (dialog.current.style.transform = `translateY(${height}px)`)
      dialog.current.style.setProperty('--backdrop-blur', '0')
      dialog.current.style.setProperty('--backdrop-opacity', '0')

      setTimeout(() => {
        dialog.current.classList.remove('closing')
        dialog.current.style.transform = ''
        dialog.current.style.setProperty('--backdrop-blur', '')
        dialog.current.style.setProperty('--backdrop-opacity', '')
        dialog.current.close()
      }, 200)
    },
    isOpen: () => opened,
  }

  attachControls(controls)
  observe(document, 'click', event => {
    if (opened) {
      const rect = dialog.current?.getBoundingClientRect()
      if (!(
        rect &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      )) {
        controls.close()
      }
    }
  })

  let dragstart
  let lastpos
  let lastvel
  let dragging = false
  observe(dialog, 'touchstart', event => {
    dragstart = [event.touches[0].clientX, event.touches[0].clientY]
    lastpos = event.touches[0].clientY
    const rect = dialog.current.getBoundingClientRect()
    dragging = dragstart[1] < rect.top + rect.height / 4 ||
      dragstart[1] < window.innerHeight / 2
  }, { passive: true })
  observe(dialog, 'touchmove', event => {
    lastvel = event.touches[0].clientY - lastpos
    lastpos = event.touches[0].clientY
    const dragmove = lastpos - dragstart[1]
    if (dragging && dragmove > 0) {
      dialog.current.style.transition = 'none'
      dialog.current.style.transform = `translateY(${dragmove}px)`
      const rate = Math.min(1, 200 / dragmove)
      dialog.current.style.setProperty('--backdrop-blur', `${Math.floor(5 * rate)}px`)
      dialog.current.style.setProperty('--backdrop-opacity', `${rate / 1.5}`)
    }
  }, { passive: true })
  observe(dialog, 'touchend', event => {
    if (dragging) {
      dialog.current.style.transition = ''
      const rect = dialog.current.getBoundingClientRect()
      const dragend = [event.changedTouches[0].clientX, event.changedTouches[0].clientY]
      const dx = dragend[0] - dragstart[0]
      const dy = dragend[1] - dragstart[1]
      if ((lastvel > 5 || dy > rect.height * .6) && Math.abs(dx) / dy < .5 && dy > 75) {
        controls.close()
      } else {
        dialog.current.style.setProperty('--backdrop-blur', '')
        dialog.current.style.setProperty('--backdrop-opacity', '')
        dialog.current.style.transform = ''
      }
    }
  }, { passive: true })

  return html`
    <link rel="stylesheet" href="./client/design/glass/modal/styles.css" />
    <dialog ref=${dialog}>
      <header style=${noheader ? 'display: none' : ''}>
        <h1><slot name="title"></slot></h1>
        <close-pin onclick=${() => controls.close()}></close-pin>
      </header>
      <slot></slot>
    </dialog>
  `
})
