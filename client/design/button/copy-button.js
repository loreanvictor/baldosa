import { define, onAttribute, attachControls, currentNode, on } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'

import '../glass/toast/component.js'
import '../misc/resizing-label.js'


define('copy-toast', () => {
  const toast = ref()
  const label = ref()

  attachControls({
    open: () => toast.current.controls.open(),
  })

  onAttribute('label', l => {
    label.current.setAttribute('locked', !toast.current.hasAttribute('open'))
    label.current.setAttribute('text', l && l.length > 0 ? l : 'Copied to clipboard!')
  })

  return html`
    <glass-toast ref=${toast}>
      <resizing-label ref=${label}></resizing-label>
    </glass-toast>
  `
})


define('copy-button', () => {
  const self = currentNode()
  const toast = ref()
  let successtimeout
  let content
  let toastlabel

  onAttribute('content', c => content = c)
  onAttribute('toast', l => toastlabel = l)

  on('click', () => {
    if (content) {
      navigator.clipboard?.writeText(content)
        .then(() => {
          toast.current.setAttribute('label', toastlabel)
          toast.current.controls.open()

          const icon = self.querySelector('toggle-icon')

          clearTimeout(successtimeout)
          icon.setAttribute('alt', true)
          successtimeout = setTimeout(() => {
            icon.setAttribute('alt', false)
          }, 3000)
        })
    }
  })

  return html`
    <slot></slot>
    <copy-toast ref=${toast}></copy-toast>
  `
})
