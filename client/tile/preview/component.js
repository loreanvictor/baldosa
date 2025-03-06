import { define, onProperty, onAttribute } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'
import copy from 'https://esm.sh/copy-to-clipboard'

window.c = copy

import '../../design/glass/modal/component.js'
import '../../design/glass/toast/component.js'
import '../../design/button/components.js'
import '../../bookmark/button/components.js'
import '../../design/icon.js'


define('tile-preview', () => {
  const mask = ref()
  const baseURL = ref()

  const tile = ref()

  const modal = ref()
  const copytoast = ref()
  const img = ref()
  const title = ref()
  const subtitle = ref()
  const pos = ref()
  const bookmark = ref()
  const opts = ref()

  onAttribute('base-url', url => baseURL.current = url)
  onProperty('mask', m => mask.current = m)
  onProperty('tile', t => {
    tile.current = t
    bookmark.current.setProperty('tile', t)
    if (t?.meta && mask.current?.has(t.x, t.y)) {
      title.current.textContent = t.meta?.title ?? ''
      subtitle.current.textContent = t.meta?.subtitle ?? ''
      img.current.src = `${baseURL.current}/tile-${t.x}-${t.y}.jpg`
      pos.current.textContent = `tile position: ${t.x}, ${t.y}`

      modal.current.controls.open()
    }
  })

  const open = () => tile.current.meta?.link && window.open(tile.current.meta?.link, '_blank')
  const copylink = () => {
    if (tile.current.meta?.link) {
      navigator.clipboard?.writeText(tile.current.meta.link)
        .then(() => copytoast.current.controls.open())
    }
  }
  const copytilelink = () => navigator.clipboard?.writeText(
    `${window.location.origin}${window.location.pathname}?tile=${tile.current.x},${tile.current.y}`)
      .then(() => copytoast.current.controls.open())

  return html`
    <link rel="stylesheet" href="./client/tile/preview/styles.css" />
    <glass-modal ref=${modal}>
      <article>
        <img ref=${img} />
        <h1 ref=${title}></h1>
        <span ref=${subtitle}></span><br/>
        <sub ref=${pos}></sub>
      </article>
      <div role="group">
        <primary-button onclick=${open}>Open</primary-button>
        <secondary-button onclick=${() => opts.current.controls.open()}>
          <i-con src='ellipsis' dark thick slot='icon'></i-con>
        </secondary-button>
      </div>
    </glass-modal>
    <glass-modal ref=${opts} noheader>
      <action-list>
        <secondary-button row>
          <i-con src='bid' dark thick slot='icon'></i-con>
          Bid on Tile
        </secondary-button>
        <secondary-button row onclick=${copylink}>
          <i-con src='link' dark thick slot='icon'></i-con>
          Copy Link
        </secondary-button>
        <secondary-button row onclick=${copytilelink}>
          <i-con src='pin' dark thick slot='icon'></i-con>
          Copy Tile Link
        </secondary-button>
        <bookmark-button ref=${bookmark}></bookmark-button>
        <secondary-button row warn>
          <i-con src='flag' dark thick slot='icon'></i-con>
          Report Content
        </secondary-button>
        <secondary-button row faded onclick=${() => opts.current.controls.close()}>
          Cancel
        </secondary-button>
      </action-list>
      <glass-toast ref=${copytoast}>Copied to clipboard!</glass-toast>
    </glass-modal>
  `
})
