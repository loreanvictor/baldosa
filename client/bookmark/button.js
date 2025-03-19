import { define, onProperty, onAttribute } from 'minicomp'
import { html, ref } from 'rehtm'

import '../design/glass/toast/component.js'
import '../design/misc/icon/component.js'

import './toast.js'
import { add, remove, is } from './db.js'


define('bookmark-button', () => {
  const toast = ref()
  const btn = ref()
  const icon = ref()
  const text = ref()

  let tile
  let bookmarked = false
  let isicon = false

  const toggle = () => {
    bookmarked = !bookmarked
    update()
    
    if (bookmarked) {
      add(tile).then(() => toast.current.controls.open())
    } else {
      remove(tile).then(() => toast.current.controls.open(true))
    }
  }

  const update = () => {
    text.current.textContent = bookmarked ? 'Remove from Bookmarks' : 'Save to Bookmarks'
    icon.current.setAttribute('alt', bookmarked)
  }

  onProperty('tile', t => {
    tile = t
    bookmarked = false
    t && is(t).then(b => {
      bookmarked = b
      update()
    })
  })

  onAttribute('icon', i => {
    isicon = !!i
    btn.current.setAttribute('row', !isicon)
    text.current.hidden = isicon
  })

  return html`
    <secondary-button ref=${btn} row onclick=${toggle}>
      <toggle-icon ref=${icon} slot='icon'>
        <i-con src='bookmark' dark thick></i-con>
        <i-con src='bookmark' fill dark thick slot='alt'></i-con>
      </toggle-icon>
      <span ref=${text}>Save to Bookmarks</span>
    </secondary-button>
    <bookmark-toast ref=${toast}></bookmark-toast>
  `
})
