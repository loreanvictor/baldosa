import { attachControls } from 'minicomp'
import { ref, html } from 'rehtm'

import { singleton } from '../util/singleton.js'
import '../design/overlays/modal/component.js'
import '../design/display/mark-down/component.js'


export const modal = singleton('terms-modal', () => {
  const modal = ref()
  attachControls({ open: () => modal.current.controls.open() })

  return html`
    <glass-modal ref=${modal}>
      <div style='max-height: 75vh; overflow: auto'>
        <mark-down src='./terms.md' raw safe></mark-down>
      </div>
    </glass-modal>
  `
})
