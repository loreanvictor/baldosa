import { define, onAttribute, currentNode } from 'https://esm.sh/minicomp'


define('circle-progress', () => {
  const self = currentNode()

  onAttribute('progress', p => {
    self.style.setProperty('--progress', p)
  })

  onAttribute('size', s => {
    const size = s ?? '44'
    self.style.setProperty('--size', `${size}px`)
    self.setAttribute('viewBox', `0 0 ${size} ${size}`)
  })

  return `
    <link rel="stylesheet" href="./client/design/misc/circle-progress/styles.css" />
    <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
      <circle/>
    </svg>
  `
})
