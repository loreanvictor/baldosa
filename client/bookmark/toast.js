import { attachControls } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import { singleton } from '../util/singleton.js'


export const toast = singleton('bookmark-toast', () => {
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
