import { define, onProperty } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'

import '../design/glass/modal/component.js'
import '../design/button/components.js'
import '../design/misc/icon/component.js'
import '../design/button/copy-button.js'
import '../bookmark/button.js'

import { tilelink } from './util/tile-link.js'
import './bid/button.js'


define('empty-tile-actions', () => {
  const modal = ref()
  const bookmark = ref()
  const link = ref()

  let tile

  onProperty('tile', t => {
    tile = t
    if (tile) {
      modal.current.controls.open()
      bookmark.current.setProperty('tile', tile)
      link.current.setAttribute('content', tilelink(tile))
    }
  })

  return html`
    <glass-modal noheader ref=${modal}>
      <action-list>
        <bid-button></bid-button>
        <!-- <tile-link-button ref=${link}></tile-link-button> -->
        <copy-button ref=${link}>
          <secondary-button row>
            Copy Tile Link
            <i-con src='pin' dark thick slot='icon'></i-con>
          </secondary-button>
        </copy-button>
        <bookmark-button ref=${bookmark}></bookmark-button>
        <secondary-button row faded onclick=${() => modal.current.controls.close()}>
          Cancel
        </secondary-button>
      </action-list>
    </glass-modal>
  `
})
