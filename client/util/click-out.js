import { on, currentNode } from 'minicomp'

import { observe } from './observe.js'

export const outOfRect = (pos, rect) => {
  return !(rect && pos.x >= rect.left && pos.x <= rect.right && pos.y >= rect.top && pos.y <= rect.bottom)
}

export const onClickOutOf = (ref, fn, flag) => {
  on('mousedown', (event) => {
    if (event.isTrusted && (!flag || flag())) {
      event.stopPropagation()
      const rect = ref.current?.getBoundingClientRect()
      if (outOfRect({ x: event.clientX, y: event.clientY }, rect)) {
        fn()
      }
    }
  })
}

export const onClickOutOfMe = (fn, flag) => {
  const self = currentNode()
  observe(document, 'pointerdown', (event) => {
    if (event.isTrusted && (!flag || flag())) {
      const rect = self.getBoundingClientRect()
      if (outOfRect({ x: event.clientX, y: event.clientY }, rect)) {
        fn()
      }
    }
  })
}
