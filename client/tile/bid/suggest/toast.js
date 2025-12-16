import { define, attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import '../../../design/overlays/toast/component.js'
import '../../../design/display/resizing-label.js'

define('suggest-bid-content-toast', () => {
  const toast = ref()
  const label = ref()

  attachControls({
    open: () => {
      label.current.setAttribute('locked', !toast.current.hasAttribute('open'))
      label.current.setAttribute('text', 'Trying some magic ...')
      toast.current.setAttribute('time', 10_000)
      toast.current.controls.open()
    },
    succeed: () => {
      label.current.setAttribute('locked', !toast.current.hasAttribute('open'))
      label.current.setAttribute('text', 'Magical content suggestion provided!')
      toast.current.setAttribute('time', 2_000)
      toast.current.controls.open()
    },
    fail: () => {
      label.current.setAttribute('locked', !toast.current.hasAttribute('open'))
      label.current.setAttribute('text', 'Unfortunately, magic failed.')
      toast.current.setAttribute('time', 3_000)
      toast.current.controls.open()
    },
  })

  return html`
    <glass-toast ref=${toast}>
      <resizing-label ref=${label}></resizing-label>
    </glass-toast>
  `
})
