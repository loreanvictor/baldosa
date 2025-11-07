import { attachControls } from 'minicomp'
import { html, ref } from 'rehtm'

import { singleton } from '../../util/singleton.js'

import '../../design/overlays/modal/component.js'
import '../../design/display/textual.js'
import '../../design/buttons/button/components.js'
import '../../design/display/icon/component.js'


export const modal = singleton('bid-success-modal', () => {
  const modal = ref()
  const submitted = ref()
  const published = ref()

  attachControls({
    open: bid => {
      if (bid.published_at) {
        published.current.style.display = 'block'
        submitted.current.style.display = 'none'
      } else {
        published.current.style.display = 'none'
        submitted.current.style.display = 'block'
      }

      modal.current.controls.open()
    }
  })

  return html`
    <style>
      i-con {
        width: 8em;
        display: block;
        margin: 0 auto;
        --color: var(--blue-fg);
      }
    </style>
    <glass-modal ref=${modal}>
      <div class='submitted' ref=${submitted}>
        <i-con src='bid' dark thick></i-con>
        <p>
          Your bid has been successfully submitted. If its the highest on the next auction, your content will be published on the tile.
        </p>
        <small-hint>
          If you don't win the next auction, your bid will remain active for all future auctions
          on the tile, until it either wins an auction or you cancel it.
        </small-hint>
      </div>
      <div class='published' ref=${published}>
      <i-con src='badge' dark thick></i-con>
        <p>
          Your content was successfully published on the tile, and will be displayed
          publicly for at least one day, until the next auction.
        </p>
        <small-hint>
          Note that sometimes it might take a while for the changes to be visible for everyone,
          due to local or network caching. Wait a few minutes and reload to see the changes.
        </small-hint>
      </div>
      <br/>
      <primary-button onclick=${() => modal.current.controls.close()}>
        Got It!
      </primary-button>
    </glass-modal>
  `
})
