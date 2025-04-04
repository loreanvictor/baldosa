import { define, onProperty, onAttribute } from 'minicomp'
import { ref, html } from 'rehtm'

import { modal as uc } from '../../util/under-construction.js'
import '../../util/show-only.js'
import '../../design/glass/modal/component.js'
import '../../design/glass/toast/component.js'
import '../../design/button/components.js'
import '../../design/misc/icon/component.js'
import '../../design/button/copy-button.js'
import '../../design/misc/mark-down/component.js'
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
  const article = ref()
  const title = ref()
  const subtitle = ref()
  const description = ref()
  const deets = ref()
  const pos = ref()
  const prim = ref()
  const bookmark = ref()
  const link = ref()
  const tlink = ref()
  const opts = ref()
  const bid = ref()

  onAttribute('base-url', url => baseURL.current = url)
  onProperty('mask', m => mask.current = m)
  onProperty('tile', t => {
    tile = t
    bookmark.current.setProperty('tile', t)
    link.current.setAttribute('content', t?.meta?.link ?? '')
    tlink.current.setAttribute('content', tilelink(t))

    if (t?.meta && mask.current?.has(t.x, t.y)) {
      article.current.classList.toggle('empty', !t.meta.title && !t.meta.subtitle)
      t.img = `${baseURL.current}/tile-${t.x}-${t.y}.jpg`
      title.current.textContent = t.meta?.title ?? ''
      title.current.style = t.meta?.title ? '' : 'display: none'
      img.current.src = tile.img
      deets.current.setAttribute('when', t.meta?.subtitle || t.meta?.description)
      subtitle.current.textContent = t.meta?.subtitle ?? ''
      description.current.setAttribute('content', t.meta?.description)
      pos.current.textContent = `tile position: ${t.x}, ${t.y}`
      prim.current.setAttribute('when', t?.meta?.link)
      bid.current.style.display = (t?.meta?.details?.bid === false) ? 'none' : ''

      modal.current.controls.open()
    }
  })

  const open = () => tile?.meta?.link && window.open(tile?.meta?.link, '_blank')

  return html`
    <link rel="stylesheet" href="./client/tile/preview/styles.css" />

    <glass-modal ref=${modal}>
      <article ref=${article}>
        <img ref=${img} />
        <h1 ref=${title}></h1>
        <show-only ref=${deets}>
          <span ref=${subtitle}></span>
          <mark-down ref=${description}></mark-down>
          <sub ref=${pos}></sub>
        </show-only>
      </article>
      <div role="group">
        <secondary-button
          onclick=${e => opts.current.controls.open({ anchor: e.target.closest('secondary-button') })}>
          <i-con src='ellipsis' dark thick slot='icon'></i-con>
        </secondary-button>
        <bookmark-button icon ref=${bookmark}></bookmark-button>
        <show-only ref=${prim}>
          <primary-button onclick=${open}>
            Open
            <i-con src='square-arrow' light thick slot='icon'></i-con>
          </primary-button>
        </show-only>
      </div>
    </glass-modal>

    <glass-modal ref=${opts} noheader>
      <action-list>
        <bid-button ref=${bid}></bid-button>
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
        <secondary-button row warn onclick=${() => uc().controls.open()}>
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
