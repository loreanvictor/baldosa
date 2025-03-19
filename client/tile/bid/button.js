import { define } from 'minicomp'
import { html } from 'rehtm'

import '../../design/button/components.js'


define('bid-button', () => {
  // TODO

  return html`
    <secondary-button row>
      <i-con src='bid' dark thick slot='icon'></i-con>
      Bid on Tile
    </secondary-button>
  `
})
