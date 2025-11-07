import { define, onProperty, onAttribute } from 'minicomp'
import { html, ref } from 'rehtm'

import { onBroadcast } from '../../util/broadcast.js'
import '../../design/overlays/modal/component.js'
import '../../design/display/icon/component.js'
import '../../design/buttons/button/components.js'
import '../../design/buttons/copy-button.js'
import '../../bookmark/button.js'

import { tilelink } from '../util/tile-link.js'
import '../bid/button.js'


define('empty-tile-actions', () => {
  const baseURL = ref()
  const modal = ref()
  const bid = ref()
  const bookmark = ref()
  const link = ref()

  let tile

  onAttribute('base-url', url => baseURL.current = url)
  onProperty('tile', t => {
    tile = t
    if (tile) {
      tile.meta && (tile.img = `${baseURL.current}/tile-${t.x}-${t.y}.jpg`)
      modal.current.controls.open()
      bookmark.current.setProperty('tile', tile)
      link.current.setAttribute('content', tilelink(tile))
      bid.current.style.display = (tile.meta?.details?.bid === false) ? 'none' : ''
      bid.current.setProperty('tile', tile)
    }
  })

  onBroadcast('bid:submitted', () => modal.current.controls.close())

  return html`
    <glass-modal noheader ref=${modal}>
      <action-list>
        <bid-button ref=${bid}></bid-button>
        <copy-button ref=${link}>
          <secondary-button row>
            Copy Tile Link
            <toggle-icon slot='icon'>
              <i-con src='pin' dark thick></i-con>
              <i-con src='check' dark thick slot='alt'></i-con>
            </toggle-icon>
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
