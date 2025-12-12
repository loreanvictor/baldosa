import { define, onProperty, onAttribute } from 'minicomp'
import { html, ref } from 'rehtm'

import '../term/button.js'
import { imageUrl } from './image-url.js'

define('tile-preview', () => {
  let term
  let x, y
  let content
  const pos = ref()
  const img = ref()
  const title = ref()
  const subtitle = ref()
  const description = ref()
  const link = ref()

  const load = () => {
    if (x && y && term && content) {
      pos.current.textContent = `${x}, ${y}`
      pos.current.href = `/?tile=${x},${y}`
      img.current.src = imageUrl(x, y, term)
      title.current.textContent = content.title
      subtitle.current.textContent = content.subtitle
      description.current.textContent = content.description
      link.current.textContent = content.url
      link.current.href = content.url
    }
  }

  onAttribute('x', (p) => ((x = p), load()))
  onAttribute('y', (p) => ((y = p), load()))
  onProperty('term', (t) => ((term = t), load()))
  onProperty('content', (c) => ((content = c), load()))

  return html`
    <style>
      p {
        margin: 0;
        padding: 0;
      }

      img {
        width: 100%;
        border-radius: 3px;
      }

      a {
        color: var(--fg);
      }

      a[main] {
        color: var(--primary);
      }
    </style>
    <div>
      <img ref=${img} />
      <a ref=${pos} target="_blank"></a><br /><br />
      <p><t-hl ref=${title}></t-hl></p>
      <p><i ref=${subtitle}></i></p>
      <p ref=${description}></p>
      <a main ref=${link} target="_blank"></a><br />
    </div>
  `
})
