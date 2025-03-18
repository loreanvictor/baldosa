import { on, currentNode } from 'https://esm.sh/minicomp'


export const onClickOut = (ref, flag, fn) => {
  on('click', event => {
    if (flag()) {
      event.stopPropagation()
      const rect = ref.current?.getBoundingClientRect()
      if (!(rect && event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom)) {
        fn()
      }
    }
  })
}


export const triggerPrimaryActionOnEnter = () => {
  const self = currentNode()
  on('keydown', event => {
    if (event.key === 'Enter') {
      self.querySelector('[primary-modal-action]')?.click()
    }
  })
}
