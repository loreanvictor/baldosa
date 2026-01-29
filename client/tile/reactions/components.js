import { define, onProperty } from 'minicomp'
import { html, ref } from 'rehtm'

import '../../design/buttons/reaction-button/component.js'
import { user, authenticated } from '../../account/auth/index.js'

import { reactions, like, unlike } from './backend.js'

define('like-button', () => {
  const btn$ = ref()
  let tile

  onProperty('tile', (t) => setTile(t))
  const setTile = async (t) => {
    tile = t
    btn$.current.setAttribute('count', undefined)
    btn$.current.removeAttribute('reacted')

    if (tile) {
      try {
        btn$.current.toggleAttribute('loading', true)
        const data = await reactions(tile)
        btn$.current.setAttribute('count', data.likes)
        btn$.current.toggleAttribute('reacted', data.likedByUser)
        btn$.current.toggleAttribute('loading', false)
      } catch (err) {
        console.error(err)
      }
    }
  }

  return html`<reaction-button
    ref=${btn$}
    confetti
    ontoggle=${async ({ detail }) => {
      if (detail.reacted) {
        if (!user()) {
          detail.block()
          await authenticated()
          await setTile(tile)
          if (!btn$.current.hasAttribute('reacted')) {
            detail.unblock()
          }
        } else {
          await like(tile)
        }
      } else {
        await unlike(tile)
      }
    }}
  ></reaction-button>`
})
