import { define, onAttribute } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'


const BASE = './client/assets/icons/'

define('i-con', ({ src, dark, thick, fill }) => {
  const img = ref()

  const update = () => {
    img.current.src = `${BASE}${src}-${dark ? 'dark' : 'light'}${fill ? '-fill' : thick ? '-thick' : ''}.svg`
  }

  onAttribute('src', s => { src = s; update() })
  onAttribute('dark', d => { dark = d; update() })
  onAttribute('thick', t => { thick = t; update() })
  onAttribute('fill', f => { fill = f; update() })

  return html`
    <style>img { width: 100%; }</style>
    <img ref=${img} />
  `
})
