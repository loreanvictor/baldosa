import { define, onAttribute, useDispatch } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'


const BASE = `${window.location}/client/assets/icons/`

define('i-con', ({ src, dark, thick, fill }) => {
  const load = useDispatch('load')
  const holder = ref()
  const img = ref()

  const calcsrc = () => `${BASE}${src}-${dark ? 'dark' : 'light'}${fill ? '-fill' : thick ? '-thick' : ''}.svg`
  const update = () => {
    img.current.src = calcsrc()
    img.current.setAttribute('alt', src)
    holder.current.style.setProperty('mask-image', `url('${calcsrc()}')`)
    holder.current.style.setProperty('-webkit-mask-image', `url('${calcsrc()}')`)
  }

  onAttribute('src', s => { src = s; update() })
  onAttribute('dark', d => { dark = d; update() })
  onAttribute('thick', t => { thick = t; update() })
  onAttribute('fill', f => { fill = f; update() })

  return html`
    <link rel="stylesheet" href="./client/design/misc/icon/styles.css" />
    <div ref=${holder}></div>
    <img ref=${img} onload=${() => load({ url: calcsrc(), src, dark, thick, fill })} />
  `
})


define('toggle-icon', () => {
  const main = ref()
  const alt = ref()

  onAttribute('alt', alternate => {
    if (alternate) {
      main.current.style.opacity = 0
      alt.current.style.opacity = 1
    } else {
      main.current.style.opacity = 1
      alt.current.style.opacity = 0
    }
  })

  return html`
    <style>
      :host {
        position: relative;
      }

      div { transition: opacity .2s ease-in-out; }
      .alt {
        position: absolute;
        left: 0; top: 0; bottom: 0; right: 0;
        opacity: 0;
      }
    </style>
    <div class='main' ref=${main}>
      <slot></slot>
    </div>
    <div class='alt' ref=${alt}>
      <slot name='alt'></slot>
    </div>
  `
})
