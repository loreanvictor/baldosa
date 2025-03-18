import { attachControls } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import { singleton } from '../util/singleton.js'
import '../design/glass/modal/component.js'
import '../design/misc/mark-down/component.js'


export const modal = singleton('terms-modal', () => {
  const modal = ref()
  attachControls({ open: () => modal.current.controls.open() })

  return html`
    <glass-modal ref=${modal}>
      <div style='max-height: 75vh; overflow: auto'>
        <mark-down src='./terms.md'></mark-down>
      </div>
    </glass-modal>
  `
})
