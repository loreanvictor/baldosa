import { define, attachControls } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import { observe } from '../util/observe.js'


define('glass-modal', () => {
  const dialog = ref()
  const closepin = ref()
  let opened = false
  let warmup

  const controls = {
    open: () => {
      dialog.current.showModal()
      dialog.current.focus()
      clearTimeout(warmup)
      warmup = setTimeout(() => opened = true, 50)
    },
    close: () => {
      closepin.current.blur()
      clearTimeout(warmup)
      opened = false
      dialog.current.close()
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
  let moved = false
  observe(dialog, 'touchstart', event => {
    dragstart = [event.touches[0].clientX, event.touches[0].clientY]
    moved = false
    lastpos = event.touches[0].clientY
  }, { passive: true })
  observe(dialog, 'touchmove', event => {
    lastvel = event.touches[0].clientY - lastpos
    lastpos = event.touches[0].clientY
    const dragmove = lastpos - dragstart[1]
    if (dragmove > 0 && (Math.abs(lastvel > 10) || moved)) {
      moved = true
      dialog.current.style.transition = ''
      dialog.current.style.transform = `translateY(${dragmove}px)`
      const rate = Math.min(1, 200 / dragmove)
      dialog.current.style.setProperty('--backdrop-blur', `${Math.floor(5 * rate)}px`)
      dialog.current.style.setProperty('--backdrop-opacity', `${rate / 1.5}`)
    }
  }, { passive: true })
  observe(dialog, 'touchend', event => {
    moved = false
    dialog.current.style.transform = ''
    dialog.current.style.setProperty('--backdrop-blur', '5px')
    dialog.current.style.setProperty('--backdrop-opacity', '1')
    dialog.current.style.transition = 'transform 0.2s ease'
    setTimeout(() => dialog.current.style.transition = '', 200)
    const dragend = [event.changedTouches[0].clientX, event.changedTouches[0].clientY]
    const dx = dragend[0] - dragstart[0]
    const dy = dragend[1] - dragstart[1]
    if (lastvel > 10 && Math.abs(dx) < 100 && dy > 100) {
      controls.close()
    }
  }, { passive: true })

  return html`
    <link rel="stylesheet" href="./client/design/glass-modal.css" />
    <dialog ref=${dialog}>
      <header>
        <h1><slot name="title"></slot></h1>
        <button ref=${closepin} onclick=${() => controls.close()}></button>
      </header>
      <slot></slot>
    </dialog>
  `
})
