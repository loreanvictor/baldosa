import { Dexie } from 'https://unpkg.com/dexie/dist/modern/dexie.min.mjs'


const db = new Dexie('bookmarks')
db.version(1).stores({ bookmarks: '++id, [x+y]' })

export const add = async tile => {
  await db.bookmarks.add({ x: tile.x, y: tile.y, meta: tile.meta })
}

export const all = async () => {
  return await db.bookmarks.toArray()
}

export const is = async tile => {
  try {
    return await db.bookmarks.where({ x: tile.x, y: tile.y }).first() !== undefined
  } catch (e) {
    console.log('NAAAAAA')
    console.log(tile)
    throw e
  }
}

export const clear = async () => {
  await db.bookmarks.clear()
}

export const remove = async tile => {
  await db.bookmarks.where({ x: tile.x, y: tile.y }).delete()
}
