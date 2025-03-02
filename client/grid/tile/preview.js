import { define, onProperty, onAttribute } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import '../../design/glass-modal.js'
import '../../design/buttons.js'


define('tile-preview', () => {
  const mask = ref()
  const baseURL = ref()

  const tile = ref()

  const modal = ref()
  const img = ref()
  const title = ref()
  const subtitle = ref()
  const pos = ref()
  const opts = ref()

  onAttribute('base-url', url => baseURL.current = url)
  onProperty('mask', m => mask.current = m)
  onProperty('tile', t => {
    tile.current = t
    if (t?.meta && mask.current?.has(t.x, t.y)) {
      title.current.textContent = t.meta?.title ?? ''
      subtitle.current.textContent = t.meta?.subtitle ?? ''
      img.current.src = `${baseURL.current}/tile-${t.x}-${t.y}.jpg`
      pos.current.textContent = `tile position: ${t.x}, ${t.y}`

      modal.current.controls.open()
    }
  })

  const open = () => {
    if (tile.current.meta?.link) {
      window.open(tile.current.meta?.link, '_blank')
    }
  }

  return html`
    <link rel="stylesheet" href="./client/grid/tile/preview.css" />
    <glass-modal ref=${modal}>
      <img ref=${img} />
      <h1 ref=${title}></h1>
      <span ref=${subtitle}></span><br/>
      <sub ref=${pos}></sub>
      <br/><br/>
      <div role="group">
        <primary-button onclick=${open}>Open</primary-button>
        <secondary-button onclick=${() => opts.current.controls.open()}>…</secondary-button>
      </div>
    </glass-modal>
    <glass-modal ref=${opts} noheader>
      <span slot="title">Options</span>
      <action-list>
        <secondary-button>Bid on Tile</secondary-button>
        <secondary-button>Share Post</secondary-button>
        <secondary-button>Add to Bookmarks</secondary-button>
        <secondary-button>Report Content</secondary-button>
      </action-list>
    </glass-modal>
  `
})
