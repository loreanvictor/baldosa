import { attachControls, onConnected } from 'minicomp'
import { ref, html } from 'rehtm'

import { conf } from '../../config.js'

import { singleton } from '../../util/singleton.js'
import { broadcast, onBroadcast } from '../../util/broadcast.js'
import { trim } from '../../util/format.js'
import { openlink } from '../../util/open-link.js'
import '../../util/keyed-list.js'

import '../../design/overlays/modal/component.js'
import '../../design/buttons/button/components.js'
import '../../design/layout/swipe-card/component.js'
import '../../design/display/icon/component.js'
import '../../design/display/textual.js'

import { tiles } from './backend.js'

const imgUrl = (x, y) => `${conf('GRID_BASE_URL')}/tile-${x}-${y}.jpg`

export const modal = singleton('account-tiles-modal', () => {
  const modal = ref()
  const list = ref()

  attachControls({
    open: () => modal.current.controls.open(),
  })

  onBroadcast('tile:published', (t) => list.current.controls.prepend(t))
  onBroadcast('tile:unpublished', (t) => list.current.controls.remove(`${t.x}:${t.y}`))

  onConnected(async () => list.current.controls.init(await tiles()))

  const goto = (bid) => {
    modal.current.controls.close()
    broadcast('tile:goto', bid)
  }

  const preview = (bid) => broadcast('tile:open', { x: bid.x, y: bid.y })
  const open = (bid) => {
    if (bid.content.url) {
      openlink(bid.content.url)
    } else {
      preview(bid)
    }
  }

  return html`
    <style>
      .list {
        overflow: auto;
        max-height: 85vh;
      }
      h1 {
        font-size: 1.2em;
      }
      p {
        font-size: 0.9em;
        font-weight: 100;
      }
      h1,
      p {
        padding: 0;
        margin: 0;
      }
      swipe-card {
        margin-bottom: 1ch;
        i-con {
          vertical-align: middle;
          width: 32px;
        }
      }
    </style>
    <glass-modal ref=${modal} aside>
      <span slot="title">Tiles</span>
      <div class="list">
        <keyed-list
          ref=${list}
          each=${(bid) => html`
            <swipe-card
              key=${`${bid.x}:${bid.y}`}
              onaction=${() => preview(bid)}
              onswiperight=${() => goto(bid)}
              onswipeleft=${() => open(bid)}
            >
              <img src=${imgUrl(bid.x, bid.y)} slot="image" />
              <h1>${trim(bid.content.title ?? '', 32)}</h1>
              <p>${trim(bid.content.subtitle ?? '', 64)}</p>
              <div slot="actions">
                <secondary-button onclick=${() => goto(bid)}>
                  <i-con src="arrow-right" dark thick slot="icon"></i-con>
                </secondary-button>
              </div>
              <div slot="right">Go to Tile <i-con src="arrow-right" dark thick></i-con></div>
              <div slot="left">Open Link <i-con src="square-arrow" dark thick></i-con></div>
            </swipe-card>
          `}
        ></keyed-list>
        <br />
        <small-hint>
          Tiles you currently own have content published to are displayed here. This does not include tiles you have
          previously owned, neither does it include tiles you have pending bids on.
        </small-hint>
      </div>
    </glass-modal>
  `
})
