import { user } from '../auth/index.js'

import { tiles } from './backend.js'
import { onBroadcast } from '../../util/broadcast.js'

let _tilesCached = undefined

export const tilesCached = async () => {
  if (user() !== undefined) {
    if (_tilesCached === undefined) {
      _tilesCached = await tiles()

      onBroadcast('tile:published', (t) => _tilesCached.unshift(t))
      onBroadcast('tile:unpublished', (t) => {
        const index = _tilesCached.findIndex((tt) => tt.x === t.x && tt.y === t.y)
        if (index !== -1) _tilesCached.splice(index, 1)
      })
    }

    return _tilesCached
  }
}

export const isOwned = async (x, y) => {
  const _tiles = await tilesCached()

  return _tiles && _tiles.some((t) => t.x === x && t.y === y)
}
