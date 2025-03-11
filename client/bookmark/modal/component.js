import { attachControls, onConnected } from 'https://esm.sh/minicomp'
import { ref, html } from 'https://esm.sh/rehtm'

import '../../design/button/components.js'
import '../../design/misc/icon/component.js'
import '../../design/glass/modal/component.js'
import '../../design/misc/swipe-card/component.js'
import '../../util/keyed-list.js'

import { singleton } from '../../util/singleton.js'
import { onBroadcast, broadcast } from '../../util/broadcast.js'
import { tilelink } from '../../tile/util/tile-link.js'

import '../button.js'
import '../toast.js'
import { all, remove } from '../db.js'


export const modal = singleton('bookmark-modal', () => {
  const toast = ref()
  const modal = ref()
  const opts = ref()
  const list = ref()
  const bmbutton = ref()
  const link = ref()
  const tlink = ref()

  let needupdate = false
  let selected

  const key = bookmark => `${bookmark.x},${bookmark.y}`

  onConnected(async () => list.current.controls.init(await all()))
  onBroadcast('bookmark:added', bookmark => list.current.controls.add(bookmark))
  onBroadcast('bookmark:removed', bookmark => list.current.controls.remove(key(bookmark)))
  attachControls({ open: async () => modal.current.controls.open() })
 
  const close = () => needupdate && setTimeout(() => update(), 200)
  const open = bookmark => {
    if (bookmark.meta) {
      const opened = window.open(bookmark.meta.link, '_blank')
      !opened && (location.href = bookmark.meta.link)
    } else {
      goto(bookmark)
    }
  }
  const goto = bookmark => {
    modal.current.controls.close()
    broadcast('tile:goto', bookmark)
  }
  const select = bookmark => {
    selected = bookmark
    bmbutton.current.setProperty('tile', bookmark)
    opts.current.controls.open()
    link.current.setAttribute('content', bookmark.meta?.link)
    !bookmark.meta ? link.current.setAttribute('hidden', '') : link.current.removeAttribute('hidden')
    tlink.current.setAttribute('content', tilelink(bookmark))
  }
  const del = async bookmark => {
    await list.current.controls.collapse(key(bookmark))
    await remove(bookmark)
    toast.current.controls.open(true)
  }

  return html`
    <link rel="stylesheet" href="./client/bookmark/modal/styles.css" />
    <glass-modal ref=${modal} onclose=${close}>
      <span slot='title'>Bookmarks</span>
      <div class='list'>
        <keyed-list ref=${list} each=${bookmark => {
          const empty = bookmark.meta === undefined
          const title = bookmark.meta?.title ?? 'empty tile'
          const pos = `${bookmark.x},${bookmark.y}`
          const sub = bookmark.meta?.subtitle ?? ''

          return html`
            <swipe-card key=${key(bookmark)}
              left="slide" right="sticky"
              onswipeleft=${() => del(bookmark)}
              onswiperight=${() => goto(bookmark)}
              onaction=${() => open(bookmark)}>
              <img src=${bookmark.img ?? ''} slot='image'/>
              <h1 class=${empty ? 'empty' : ''}>${title} <small>${pos}</small></h1>
              <p>${sub.length > 52 ? sub.slice(0, 52) + '…' : sub}</p>
              <div slot='actions'>
                <secondary-button onclick=${() => select(bookmark)}>
                  <i-con src='ellipsis' dark thick slot='icon'></i-con>
                </secondary-button>
              </div>
              <div slot='left'>Remove <i-con src='trash-can' dark thick></i-con></div>
              <div slot='right'>Go to Tile <i-con src='arrow-right' dark thick></i-con></div>
            </swipe-card>
          `
        }}></keyed-list>
        <small style='font-weight: 100; opacity: .5'>
          Your bookmarks appear here. You can bookmark content you want to revisit later
          using the bookmark <i-con src=bookmark dark style='width: 2.5ch; vertical-align: middle'></i-con> button.
        </small>
      </div>
      <bookmark-toast ref=${toast}></bookmark-toast>
    </glass-modal>

    <glass-modal noheader ref=${opts}>
      <action-list>
        <secondary-button onclick=${() => open(selected)} row>
          Open
          <i-con src='square-arrow' dark thick slot='icon'></i-con>
        </secondary-button>
        <secondary-button onclick=${() => goto(selected)} row>
          Go to Tile
          <i-con src='arrow-right' dark thick slot='icon'></i-con>
        </secondary-button>
        <bookmark-button ref=${bmbutton}></bookmark-button>
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
        <secondary-button row faded onclick=${() => opts.current.controls.close()}>
          Cancel
        </secondary-button>
      </action-list>
    </glass-modal>
  `
})
