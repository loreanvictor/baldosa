import { define, onProperty, onAttribute } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import '../../design/glass/modal/component.js'
import '../../design/glass/toast/component.js'
import '../../design/button/components.js'
import '../../design/misc/icon/component.js'
import '../../design/button/copy-button.js'
import '../../bookmark/button.js'

import { tilelink } from '../util/tile-link.js'
import '../bid/button.js'


define('tile-preview', () => {
  const mask = ref()
  const baseURL = ref()

  let tile

  const modal = ref()
  const copytoast = ref()
  const img = ref()
  const title = ref()
  const subtitle = ref()
  const pos = ref()
  const bookmark = ref()
  const link = ref()
  const tlink = ref()
  const opts = ref()

  onAttribute('base-url', url => baseURL.current = url)
  onProperty('mask', m => mask.current = m)
  onProperty('tile', t => {
    tile = t
    bookmark.current.setProperty('tile', t)
    link.current.setAttribute('content', t?.meta?.link)
    tlink.current.setAttribute('content', tilelink(t))

    if (t?.meta && mask.current?.has(t.x, t.y)) {
      t.img = `${baseURL.current}/tile-${t.x}-${t.y}.jpg`
      title.current.textContent = t.meta?.title ?? ''
      subtitle.current.textContent = t.meta?.subtitle ?? ''
      img.current.src = tile.img
      pos.current.textContent = `tile position: ${t.x}, ${t.y}`

      modal.current.controls.open()
    }
  })

  const open = () => tile?.meta?.link && window.open(tile?.meta?.link, '_blank')

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
        <secondary-button onclick=${() => opts.current.controls.open()}>
          <i-con src='ellipsis' dark thick slot='icon'></i-con>
        </secondary-button>
        <bookmark-button icon ref=${bookmark}></bookmark-button>
        <primary-button onclick=${open}>
          Open
          <i-con src='square-arrow' light thick slot='icon'></i-con>
        </primary-button>
      </div>
    </glass-modal>

    <glass-modal ref=${opts} noheader>
      <action-list>
        <bid-button></bid-button>
        <copy-button ref=${link}>
          <secondary-button row>
            <toggle-icon slot='icon'>
              <i-con src='link' dark thick></i-con>
              <i-con src='check' dark thick slot='alt'></i-con>
            </toggle-icon>
            Copy Link
          </secondary-button>
        </copy-button>
        <copy-button ref=${tlink} toast='Tile link copied to clipboard!'>
          <secondary-button row>
            <toggle-icon slot='icon'>
              <i-con src='pin' dark thick></i-con>
              <i-con src='check' dark thick slot='alt'></i-con>
            </toggle-icon>
            Copy Tile Link
          </secondary-button>
        </copy-button>
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
