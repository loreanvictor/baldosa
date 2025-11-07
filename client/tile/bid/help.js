import { attachControls } from 'minicomp'
import { html, ref } from 'rehtm'

import { singleton } from '../../util/singleton.js'

import '../../design/overlays/modal/component.js'
import '../../design/buttons/button/components.js'
import '../../design/display/textual.js'


const modal = singleton('bid-help-modal', () => {
  const modal = ref()

  attachControls({
    open: () => modal.current?.controls.open(),
  })

  return html`
    <style>
      span {
        background: white;
        color: black;
        font-weight: bold;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 3ch;
        height: 3ch;
        border-radius: 50%;
        margin: .5ch;
      }

      img {
        width: 75%;
        display: block;
        margin: 0 auto;
      }
    </style>
    <glass-modal ref=${modal}>
      <img src='./client/assets/bidding-guide.svg'/>
      <h2>Bidding on a Tile</h2>
      <small-hint>
        You can post your own content to each tile by bidding on it, using your coins. You can
        also bid for tiles that already have content, to have your content be displayed next.
        <br/><br/>
        <span>1</span> Choose the content you want published,
        <br/>
        <span>2</span> Use coins to bid on the tile,
        <br/>
        <span>3</span> If you win, your content is displayed for a day.
        <br/>
        <span>4</span> If you don't win, your bid remains for the next auction.
      </small-hint>
      <br/>
      <primary-button onclick=${() => modal.current?.controls.close()}>Got it</primary-button>
    </glass-modal>
  `
})

export const showHelp = () => {
  modal().controls.open()
}

export const showHelpIfNeeded = () => {
  if (window.localStorage.getItem('--bid-help-shown') !== 'true') {
    showHelp()
    window.localStorage.setItem('--bid-help-shown', 'true')
  }
}
