import { define, attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import '../design/glass/toast/component.js'
import '../design/misc/resizing-label.js'


define('bookmark-toast', () => {
  const toast = ref()
  const label = ref()

  attachControls({
    open: (removed = false) => {
      label.current.setAttribute('locked', !toast.current.hasAttribute('open'))
      label.current.setAttribute('text', removed ? 'Removed from Bookmarks' : 'Bookmark Saved!')
      toast.current.controls.open()
    },
  })

  return html`
    <glass-toast ref=${toast}>
      <resizing-label ref=${label}></resizing-label>
    </glass-toast>
  `
})
