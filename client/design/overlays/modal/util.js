import { on, currentNode } from 'minicomp'


export const triggerPrimaryActionOnEnter = () => {
  const self = currentNode()
  on('keydown', event => {
    if (event.key === 'Enter') {
      self.querySelector('[primary-modal-action]')?.click()
    }
  })
}
