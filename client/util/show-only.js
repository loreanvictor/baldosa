import { define, currentNode, onAttribute } from 'minicomp'

define('show-only', () => {
  const self = currentNode()

  onAttribute('when', (when) => {
    self.style.display = when && when !== 'false' ? 'block' : 'none'
    self.style.visibility = when && when !== 'false' ? 'visible' : 'hidden'
  })

  return '<slot></slot>'
})
