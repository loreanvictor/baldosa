import { define, onConnected, onDisconnected, currentNode, attachControls, on } from 'minicomp'
import { ref, html } from 'rehtm'

import { observe } from '../../../util/observe.js'

import { scaled } from './util.js'


// TODO: add support for more input methods:
//        - keyboard navigation
//        - drag (the bubble)

define('switcher-button', () => {
  const host = currentNode()
  const holder= ref()
  const bubble = ref()
  const selected = ref()
  let disconnectors = []

  const select = button => {
    host.querySelectorAll('&>button').forEach((btn) => btn.removeAttribute('selected'))
    button.setAttribute('selected', true)
    moveBubble(button, false)
    selected.current = button
  }

  const SQZ = 4

  const moveBubble = (button, initial) => {
    if (selected.current === button) {
      return
    }

    const parentBox = holder.current.getBoundingClientRect()

    if (parentBox.width === 0) {
      // wait for layout
      setTimeout(() => moveBubble(button, initial), 100)
      return
    }

    const bubbleBox = bubble.current.getBoundingClientRect()
    const buttonBox = initial ? scaled(button.getBoundingClientRect(), 1/1.1) : button.getBoundingClientRect()

    if (buttonBox.left < bubbleBox.left) {
      bubble.current.style.left = `${buttonBox.left - parentBox.left}px`
      bubble.current.style.top = `${buttonBox.top - parentBox.top + SQZ}px`
      bubble.current.style.height = `${buttonBox.height - 2 * SQZ}px`
      setTimeout(() => {
        bubble.current.style.right = `${parentBox.right - buttonBox.right}px`
        bubble.current.style.top = `${buttonBox.top - parentBox.top}px`
        bubble.current.style.height = `${buttonBox.height}px`
      }, 100)
    } else {
      bubble.current.style.right = `${parentBox.right - buttonBox.right}px`
      bubble.current.style.top = `${buttonBox.top - parentBox.top + SQZ}px`
      bubble.current.style.height = `${buttonBox.height - 2 * SQZ}px`
      setTimeout(() => {
        bubble.current.style.left = `${buttonBox.left - parentBox.left}px`
        bubble.current.style.top = `${buttonBox.top - parentBox.top}px`
        bubble.current.style.height = `${buttonBox.height}px`
      }, 100)
    }
  }

  let dragpos = undefined
  let ogbox = undefined
  const dragstart = e => {
    const box = bubble.current.getBoundingClientRect()
    const pos = e.changedTouches ?
      [e.changedTouches[0].clientX, e.changedTouches[0].clientY] :
      [e.clientX, e.clientY]
    if (pos[0] >= box.left && pos[0] <= box.right
      && pos[1] >= box.top && pos[1] <= box.bottom) {
      dragpos = pos
      ogbox = box
    } else {
      dragpos = undefined
    }
  }

  const dragmove = e => {
    if (dragpos) {
      const pos = e.changedTouches ?
        [e.changedTouches[0].clientX, e.changedTouches[0].clientY] :
        [e.clientX, e.clientY]
      const parentBox = holder.current.getBoundingClientRect()
      bubble.current.style.transition = 'height .15s, top .15s'
      bubble.current.style.top = `${ogbox.top - parentBox.top + SQZ}px`
      bubble.current.style.height = `${ogbox.height - 2 * SQZ}px`
      let nl, nr
      if (pos[0] < dragpos[0]) {
        nl = Math.max(pos[0] - parentBox.left - (dragpos[0] - ogbox.left), 4)
        const mr = Math.max(parentBox.right - pos[0] + (dragpos[0] - ogbox.right), 4)
        const or = parentBox.right - ogbox.right
        nr = (mr + 4 * or) / 5
      } else {
        const ml = Math.max(pos[0] - parentBox.left - (dragpos[0] - ogbox.left), 4)
        const ol = ogbox.left - parentBox.left
        nl = (ml + 4 * ol) / 5
        nr = Math.max(parentBox.right - pos[0] + (dragpos[0] - ogbox.right), 4)
      }

      bubble.current.style.left = `${nl}px`
      bubble.current.style.right = `${nr}px`
    }
  }

  const dragend = e => {
    if (dragpos) {
      dragpos = undefined
      bubble.current.style.transition = ''
      const pos = e.changedTouches ?
        [e.changedTouches[0].clientX, e.changedTouches[0].clientY] :
        [e.clientX, e.clientY]
      let btn = undefined
      host.querySelectorAll('&>button').forEach(_btn => {
        const box = _btn.getBoundingClientRect()
        if (pos[0] >= box.left && pos[0] <= box.right
          && pos[1] >= box.top && pos[1] <= box.bottom) {
          btn = _btn
        }
      })
  
      if (!btn || selected.current === btn) {
        const parentBox = holder.current.getBoundingClientRect()
        bubble.current.style.height = `${ogbox.height}px`
        bubble.current.style.top = `${ogbox.top - parentBox.top}px`
        bubble.current.style.left = `${ogbox.left - parentBox.left}px`
        bubble.current.style.right = `${parentBox.right - ogbox.right}px`
      }
  
      if (btn) {
        select(btn)
        btn.click()
      }
    }
  }

  on('pointerdown', dragstart)
  on('touchstart', dragstart, { passive: true })
  on('pointermove', dragmove)
  on('touchmove', dragmove, { passive: true })
  observe(document.body, 'pointerup', dragend)
  observe(document.body, 'touchend', dragend)

  const connect = () => {
    host.querySelectorAll('button').forEach((button) => {
      const listener = () => select(button)
      button.addEventListener('click', listener)
      disconnectors.push(() => button.removeEventListener('click', listener))
      if (button.hasAttribute('selected')) {
        requestAnimationFrame(() => moveBubble(button, true))
      }
    })
  }

  const disconnect = () => {
    disconnectors.forEach((disconnector) => disconnector())
    disconnectors = []
  }

  onConnected(connect)
  onDisconnected(disconnect)
  attachControls({
    reconnect: () => {
      disconnect()
      connect()
    }
  })

  return html`
    <link rel="stylesheet" href="./client/design/buttons/switcher/styles.css" />
    <div class='holder' ref=${holder}>
      <div class='bubble' ref=${bubble}></div>
      <slot></slot>
    </div>
  `
})
