import { define } from 'https://esm.sh/minicomp'
import { html } from 'https://esm.sh/rehtm'

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
