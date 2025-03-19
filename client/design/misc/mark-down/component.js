import { define, onAttribute } from 'minicomp'
import { ref, html } from 'rehtm'
import { micromark } from 'micromark'


define('mark-down', ({ raw, safe }) => {
  const container = ref()

  onAttribute('src', async (src) => {
    if (src) {
      const res = await fetch(src)
      const text = await res.text()
      container.current.innerHTML = micromark(text, { allowDangerousHtml: safe })
    }
  })

  return html`
    <link rel='stylesheet' href='./client/design/misc/mark-down/styles.css' />
    <div ref=${container} class='${ raw ? 'raw' : ''}'></div>
  `
})
