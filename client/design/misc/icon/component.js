import { define, onAttribute, useDispatch, ATTRIBUTE_REMOVED } from 'minicomp'
import { html, ref } from 'rehtm'


const BASE = `${window.location}/client/assets/icons/`

define('i-con', ({ src, dark, thick, fill, notifications }) => {
  const load = useDispatch('load')
  const holder = ref()
  const img = ref()
  const notif = ref()

  const calcsrc = () => `${BASE}${src}-${dark ? 'dark' : 'light'}${fill ? '-fill' : thick ? '-thick' : ''}.svg`
  const update = () => {
    img.current.src = calcsrc()
    img.current.setAttribute('alt', src)
    holder.current.style.setProperty('mask-image', `url('${calcsrc()}')`)
    holder.current.style.setProperty('-webkit-mask-image', `url('${calcsrc()}')`)
  }

  const shownotif = () => {
    const n = parseInt(notifications, 10) ?? 0

    if (n > 0 && n !== NaN) {
      notif.current.textContent = n > 99 ? '∞' : n
      notif.current.style.display = ''
    } else {
      notif.current.style.display = 'none'
      notif.current.textContent = ''
    }
  }

  const istrue = attr => attr !== undefined && attr !== ATTRIBUTE_REMOVED && attr !== 'false' && attr !== false
  onAttribute('src', s => { src = s; update() })
  onAttribute('dark', d => { dark = istrue(d); update() })
  onAttribute('thick', t => { thick = istrue(t); update() })
  onAttribute('fill', f => { fill = istrue(f); update() })
  onAttribute('notifications', n => { notifications = n; shownotif() })

  return html`
    <link rel="stylesheet" href="./client/design/misc/icon/styles.css" />
    <div ref=${holder}></div>
    <img ref=${img} onload=${() => load({ url: calcsrc(), src, dark, thick, fill })} />
    <sup ref=${notif}>0</sup>
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
