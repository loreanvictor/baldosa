import { define } from 'minicomp'
import { html } from 'rehtm'

import { modal as uc } from '../../util/under-construction.js'
import '../../design/button/components.js'


define('bid-button', () => {
  // TODO

  return html`
    <secondary-button row onclick=${() => uc().controls.open()}>
      <i-con src='bid' dark thick slot='icon'></i-con>
      Bid on Tile
    </secondary-button>
  `
})
