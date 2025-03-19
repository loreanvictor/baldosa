import { define, currentNode, onAttribute } from 'minicomp'


define('show-only', () => {
  const self = currentNode()

  onAttribute('when', when => {
    self.style.display = when ? 'block' : 'none'
    self.style.visibility = when ? 'visible' : 'hidden'
  })

  return '<slot></slot>'
})
