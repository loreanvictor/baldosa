import { define, onAttribute, currentNode } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'


const BASE = './client/assets/icons/'

define('i-con', ({ src, dark, thick, fill }) => {
  const self = currentNode()
  const img = ref()

  const calcsrc = () => `${BASE}${src}-${dark ? 'dark' : 'light'}${fill ? '-fill' : thick ? '-thick' : ''}.svg`
  const update = () => {
    if (img.current.src) {
      self.style.setProperty('--repl-bg', `url('${calcsrc()}')`)
      self.style.setProperty('--repl-opacity', '1')
      self.style.setProperty('--img-opacity', '0')
      setTimeout(() => {
        img.current.src = calcsrc()
        self.style.setProperty('--img-opacity', '1')
        setTimeout(() => {
          self.style.setProperty('--repl-opacity', '0')
        }, 200)
      }, 200)
    } else {
      img.current.src = calcsrc()
    }
  }

  onAttribute('src', s => { src = s; update() })
  onAttribute('dark', d => { dark = d; update() })
  onAttribute('thick', t => { thick = t; update() })
  onAttribute('fill', f => { fill = f; update() })

  return html`
    <style>
      :host{
        --repl-bg: none;
        --repl-opacity: 0;
        --img-opacity: 1;

        position: relative;

        img {
          width: 100%;
          opacity: var(--img-opacity);
          transition: opacity .2s;
        }
        &::after {
          content: ' ';
          position: absolute;
          background-position: center;
          background-size: contain;
          background-image: var(--repl-bg);
          opacity: var(--repl-opacity);
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          transition: opacity .2s;
        }
      }
    </style>
    <img ref=${img} />
  `
})
