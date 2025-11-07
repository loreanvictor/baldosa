import { define, onProperty } from 'minicomp'
import { html } from 'rehtm'

import { modal as uc } from '../../util/under-construction.js'
import '../../design/buttons/button/components.js'
import '../../design/display/icon/component.js'

import * as service from './index.js'


define('bid-button', () => {
  // TODO: complete this

  let tile
  onProperty('tile', t => tile = t)

  return html`
    <secondary-button row onclick=${() => service.bidOn(tile)}>
      <i-con src='bid' dark thick slot='icon'></i-con>
      Bid on Tile
    </secondary-button>
  `
})
