import { define, onAttribute, attachControls, currentNode, on } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'

import '../../design/glass/toast/component.js'
import { singleton } from '../../util/singleton.js'


const toast = singleton('copy-toast', () => {
  const toast = ref()
  const label = ref()

  attachControls({
    open: () => toast.current.controls.open(),
  })

  onAttribute('label', l => {
    const next = l && l.length > 0 ? l : 'Copied to clipboard!'
    const curr = label.current.textContent
    
    if (toast.current.hasAttribute('open') && next !== curr) {
      label.current.style = `opacity: 1; width: ${curr.length * .75}ch`
      requestAnimationFrame(() => {
        label.current.style = `opacity: 0; width: ${next.length * .75}ch`
        label.current.addEventListener('transitionend', () => {
          label.current.textContent = next
          label.current.style = ''
        }, { once: true })
      })
    } else {
      label.current.textContent = next
    }
  })

  return html`
    <style>
      span {
        width: auto;
        transition: opacity .3s, width .3s;
        overflow: hidden;
        display: inline-block;
        white-space: nowrap;
      }
    </style>
    <glass-toast ref=${toast}>
      <span ref=${label}></span>
    </glass-toast>
  `
})


define('copy-button', () => {
  const self = currentNode()
  let successtimeout
  let content
  let toastlabel
  let ogsrc

  onAttribute('content', c => content = c)
  onAttribute('toast', l => toastlabel = l)

  on('click', () => {
    if (content) {
      navigator.clipboard?.writeText(content)
        .then(() => {
          const t = toast()
          t.setAttribute('label', toastlabel)
          t.controls.open()

          const icon = self.querySelector('i-con')
          !successtimeout && (ogsrc = icon.getAttribute('src'))

          clearTimeout(successtimeout)
          icon.setAttribute('src', 'check')
          successtimeout = setTimeout(() => {
            icon.setAttribute('src', ogsrc)
            successtimeout = undefined
          }, 3000)
        })
    }
  })

  return '<slot></slot>'
})
