import { on, currentNode } from 'minicomp'

import { observe } from './observe.js'


export const onClickOutOf = (ref, fn, flag) => {
  on('click', event => {
    if (event.isTrusted && (!flag || flag())) {
      event.stopPropagation()
      const rect = ref.current?.getBoundingClientRect()
      if (!(rect && event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom)) {
        fn()
      }
    }
  })
}


export const onClickOutOfMe = (fn, flag) => {
  const self = currentNode()
  observe(document, 'pointerdown', event => {
    if (event.isTrusted && (!flag || flag())) {
      const rect = self.getBoundingClientRect()
      if (!(rect && event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom)) {
        fn()
      }
    }
  })
}