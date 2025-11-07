import { define, onAttribute } from 'minicomp'
import { ref, html } from 'rehtm'
import { micromark } from 'micromark'


define('mark-down', ({ raw, safe }) => {
  const container = ref()

  const setcontent = (text) => {
    container.current.innerHTML = micromark(text, { allowDangerousHtml: safe })
    container.current.querySelectorAll('a').forEach(link => {
      link.setAttribute('target', '_blank')
    })
  }

  onAttribute('src', async (src) => {
    if (src) {
      const res = await fetch(src)
      const text = await res.text()
      setcontent(text)
    }
  })
  onAttribute('content', content => content !== undefined && setcontent(content))

  return html`
    <link rel='stylesheet' href='./client/design/display/mark-down/styles.css' />
    <div ref=${container} class='${ raw ? 'raw' : ''}'></div>
  `
})
