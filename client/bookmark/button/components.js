import { define, onProperty } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'

import '../../design/glass/toast/component.js'
import { add, remove, is } from '../db.js'


define('bookmark-button', () => {
  const icon = ref()
  const text = ref()
  const donetoast = ref()
  const undonetoast = ref()

  let tile
  let bookmarked = false

  const toggle = () => {
    bookmarked = !bookmarked
    update()
    
    if (bookmarked) {
      undonetoast.current.controls.close()
      add(tile).then(() => {
        donetoast.current.controls.open()
      })
    } else {
      donetoast.current.controls.close()
      remove(tile).then(() => {
        undonetoast.current.controls.open()
      })
    }
  }

  const update = () => {
    text.current.textContent = bookmarked ? 'Remove from Bookmarks' : 'Save to Bookmarks'
    icon.current.setAttribute('fill', bookmarked)
  }

  onProperty('tile', t => {
    tile = t
    bookmarked = false
    t && is(t).then(b => {
      bookmarked = b
      update()
    })
  })

  return html`
    <secondary-button row onclick=${toggle}>
      <i-con ref=${icon} src='bookmark' dark thick slot='icon'></i-con>
      <span ref=${text}>Save to Bookmarks</span>
    </secondary-button>
    <glass-toast ref=${donetoast}>Added to Bookmarks</glass-toast>
    <glass-toast ref=${undonetoast}>Removed from Bookmarks</glass-toast>
  `
})
