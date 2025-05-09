import { define } from 'minicomp'
import { html } from 'rehtm'

import '../design/glass/pane.js'
import '../design/button/components.js'

import { broadcast } from '../util/broadcast.js'
import { loader } from '../util/loader.js'
import { modal as bookmarks } from '../bookmark/modal/component.js'
import { modal as account } from '../account/modal.js'


define('main-nav', () => {
  const load = loader(p => broadcast('nav:loaded', p), 'search', 'bookmarks', 'account')

  return html`
    <link rel="stylesheet" href="./client/nav/styles.css" />
    <glass-pane>
      <secondary-button>
        <i-con src='looking-glass' dark thick slot='icon'
          onload=${() => load('search')}></i-con>
      </secondary-button>
      <secondary-button onclick=${bookmarks().controls.open}>
        <i-con src='bookmark' dark thick slot='icon'
          onload=${() => load('bookmarks')}></i-con>
      </secondary-button>
      <secondary-button onclick=${account().controls.open}>
        <i-con src='person' dark thick slot='icon'
          onload=${() => load('account')}></i-con>
      </secondary-button>
    </glass-pane>
  `
})