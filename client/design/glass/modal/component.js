import { define, attachControls, useDispatch, currentNode, on } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import '../../../util/swipe-control.js'
import '../../close-pin/component.js'

import { push } from './context.js'
import { anchor, unanchor } from './anchor.js'
import { onClickOut, triggerPrimaryActionOnEnter } from './util.js'


define('glass-modal', ({ noheader }) => {
  const self = currentNode()
  const onclose = useDispatch('close')
  const dialog = ref()
  let opened = false
  let warmup

  const controls = {
    open: (opts) => {
      if (opts?.anchor && window.innerWidth > 600) {
        anchor(dialog.current, opts.anchor)
      } else {
        unanchor(dialog.current)
      }

      self.setAttribute('open', '')
      dialog.current.showModal()
      dialog.current.focus()
      clearTimeout(warmup)
      warmup = setTimeout(() => opened = true, 50)
      push(self)
    },
    close: () => {
      self.removeAttribute('open')
      clearTimeout(warmup)
      opened = false
      onclose()

      dialog.current.classList.add('closing')

      const height = dialog.current.getBoundingClientRect().height
      window.innerWidth < 600 && (dialog.current.style.transform = `translateY(${height}px)`)
      dialog.current.style.setProperty('--backdrop-blur', '0')
      dialog.current.style.setProperty('--backdrop-opacity', '0')

      setTimeout(() => {
        dialog.current.classList.remove('closing')
        dialog.current.style.transform = ''
        dialog.current.style.setProperty('--backdrop-blur', '')
        dialog.current.style.setProperty('--backdrop-opacity', '')
        dialog.current.close()
      }, 200)
    }
  }

  attachControls(controls)
  onClickOut(dialog, () => opened, controls.close)
  triggerPrimaryActionOnEnter()

  const onswipestart = ({ detail }) => {
    const rect = dialog.current.getBoundingClientRect()
    if (detail.start.y > rect.top + rect.height / 4 && detail.start.y > window.innerHeight / 2) {
      detail.disqualify()
    }
  }
  const onswipe = ({ detail }) => {
    const dy = Math.max(0, detail.d.y)

    dialog.current.style.transition = 'none'
    dialog.current.style.transform = `translateY(${dy}px)`
    const rate = Math.min(1, 200 / dy)
    dialog.current.style.setProperty('--backdrop-blur', `${Math.floor(5 * rate)}px`)
    dialog.current.style.setProperty('--backdrop-opacity', `${rate / 1.5}`)
  }
  const onrelease = ({ detail }) => {
      dialog.current.style.transition = ''

      const rect = dialog.current.getBoundingClientRect()
      const dy = detail.d.y
      const vy = detail.velocity.y

      if ((vy > 5 || dy > rect.height * .6) && detail.aligned && dy > 75 && vy > 0) {
        controls.close()
      } else {
        dialog.current.style.setProperty('--backdrop-blur', '')
        dialog.current.style.setProperty('--backdrop-opacity', '')
        dialog.current.style.transform = ''
      }
  }

  return html`
    <link rel="stylesheet" href="./client/design/glass/modal/styles.css" />
    <dialog ref=${dialog}>
      <header style=${noheader ? 'display: none' : ''}>
        <h1><slot name="title"></slot></h1>
        <close-pin onclick=${() => controls.close()}></close-pin>
      </header>
      <slot></slot>
    </dialog>
    <swipe-control direction='vertical' target=${dialog} nopropagate='false'
      onstart=${onswipestart} onswipe=${onswipe} onrelease=${onrelease}></swipe-control>
  `
})
