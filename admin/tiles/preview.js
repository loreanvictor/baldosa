import { define, onAttribute } from 'minicomp'
import { html, ref } from 'rehtm'

import '../term/components/button.js'

define('tile-preview', () => {
  let x, y
  const pos = ref()
  const img = ref()
  const title = ref()
  const subtitle = ref()
  const description = ref()
  const link = ref()

  const load = () => {
    if (x && y) {
      pos.current.textContent = `${x}, ${y}`
      pos.current.href = `/?tile=${x},${y}`
    }
  }

  onAttribute('x', (p) => ((x = p), load()))
  onAttribute('y', (p) => ((y = p), load()))
  onAttribute('title', (v) => (title.current.textContent = v ?? ''))
  onAttribute('subtitle', (v) => (subtitle.current.textContent = v ?? ''))
  onAttribute('description', (v) => (description.current.textContent = v ?? ''))
  onAttribute('url', (v) => v && ((link.current.textContent = v), (link.current.href = v)))
  onAttribute('img', (v) => v && (img.current.src = v))

  return html`
    <style>
      p {
        margin: 0;
        padding: 0;
      }

      img {
        width: 100%;
        border-radius: 1em;
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
