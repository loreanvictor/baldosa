import { Dexie } from 'https://unpkg.com/dexie/dist/modern/dexie.min.mjs'

import { broadcast } from '../util/broadcast.js'


const db = new Dexie('bookmarks')
db.version(1).stores({ bookmarks: '++id, [x+y]' })

export const add = async tile => {
  await db.bookmarks.add(tile)
  broadcast('bookmark:added', tile)
}

export const all = async () => {
  return await db.bookmarks.toArray()
}

export const is = async tile => {
  try {
    return await db.bookmarks.where({ x: tile.x, y: tile.y }).first() !== undefined
  } catch (e) {
    throw e
  }
}

export const remove = async tile => {
  await db.bookmarks.where({ x: tile.x, y: tile.y }).delete()
  broadcast('bookmark:removed', tile)
}
