import { define, onProperty, onAttribute } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import '../../design/glass/modal/component.js'
import '../../design/glass/toast/component.js'
import '../../design/button/components.js'
import '../../bookmark/button.js'
import '../../design/icon.js'

import { tilelink } from '../util/tile-link.js'
import '../util/copy-button.js'
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
      title.current.textContent = t.meta?.title ?? ''
      subtitle.current.textContent = t.meta?.subtitle ?? ''
      img.current.src = `${baseURL.current}/tile-${t.x}-${t.y}.jpg`
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
        <primary-button onclick=${open}>Open</primary-button>
        <secondary-button onclick=${() => opts.current.controls.open()}>
          <i-con src='ellipsis' dark thick slot='icon'></i-con>
        </secondary-button>
      </div>
    </glass-modal>
    <glass-modal ref=${opts} noheader>
      <action-list>
        <bid-button></bid-button>
        <copy-button ref=${link}>
          <secondary-button row>
            <i-con src='link' dark thick slot='icon'></i-con>
            Copy Link
          </secondary-button>
        </copy-button>
        <copy-button ref=${tlink} toast='Tile link copied to clipboard!'>
          <secondary-button row>
            <i-con src='pin' dark thick slot='icon'></i-con>
            Copy Tile Link
          </secondary-button>
        </copy-button>
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
