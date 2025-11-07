import { define, attachControls, useDispatch, onProperty } from 'minicomp'
import { ref, html } from 'rehtm'

import { broadcast } from '../../util/broadcast.js'
import '../../design/overlays/modal/component.js'
import '../../design/overlays/toast/component.js'
import '../../design/buttons/button/components.js'
import '../../design/buttons/confirm/component.js'
import '../../design/display/icon/component.js'
import '../../design/display/textual.js'

import { unpublish } from '../../account/tiles/backend.js'


define('tile-unpublish-button', () => {
  const unpublished = useDispatch('unpublish')

  const modal = ref()
  const toast = ref()

  let tile
  onProperty('tile', t => tile = t)

  return html`
    <secondary-button danger row onclick=${() => modal.current.controls.open(tile)}>
      <i-con src='eye-slash' dark thick slot='icon'></i-con>
      Unpublish Tile
    </secondary-button>
    <tile-unpublish ref=${modal} onunpublish=${() => toast.current.controls.open()}></tile-unpublish>
    <glass-toast ref=${toast} onclose=${() => unpublished()}>Tile Unpublished!</glass-toast>
  `
})

define('tile-unpublish', () => {
  const unpublished = useDispatch('unpublish')
  const modal = ref()
  let tile

  const _unpublish = async () => {
    await unpublish(tile)
    // TODO: perhaps error handling?
    modal.current.controls.close()
    unpublished(tile)
    broadcast('tile:unpublished', tile)
  }

  attachControls({
    open: (_tile) => {
      tile = _tile
      modal.current.controls.open()
    }
  })

  return html`
    <style>
      i-con.danger {
        --color: var(--red-fg);
        width: 16ex;
        display: block;
        margin: auto;

        @media screen and (min-width: 600px) {
          margin-top: -7ch;
        }
      }
    </style>
    <glass-modal ref=${modal}>
      <i-con class='danger' src='eye-slash' dark thick></i-con>
      <p>
        Are you sure you want to unpublish this tile? This action CANNOT BE UNDONE.
        Your content will be removed from this tile, but your coins won't be refunded.
      </p>
      <small-hint>
        Sometimes you might still see the tile after unpublishing it, as it may have been
        cached by the browser. You need to wait a few minutes and reload afterwards to see the changes.
      </small-hint>
      <br/>
      <confirm-button danger label="Unpublish Tile" onconfirm=${_unpublish}>
      </confirm-button>
    </glass-modal>
  `
})
