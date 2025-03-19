import { openDB } from 'idb'

import { broadcast } from '../util/broadcast.js'


const dbPromise = openDB('bookmarks', 10, {
  upgrade(db) {
    const store = db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true });
    store.createIndex('[x+y]', ['x', 'y'], { unique: true });
  },
})

export const add = async tile => {
  const db = await dbPromise
  await db.add('bookmarks', tile)
  broadcast('bookmark:added', tile)
}

export const all = async () => {
  const db = await dbPromise
  return await db.getAll('bookmarks')
}

export const is = async tile => {
  const db = await dbPromise
  const result = await db.getFromIndex('bookmarks', '[x+y]', IDBKeyRange.only([tile.x, tile.y]))
  return result !== undefined
}

export const remove = async tile => {
  const db = await dbPromise
  const tx = db.transaction('bookmarks', 'readwrite')
  const store = tx.objectStore('bookmarks')
  const index = store.index('[x+y]')
  const key = await index.getKey([tile.x, tile.y])

  if (key !== undefined) {
    await store.delete(key)
    broadcast('bookmark:removed', tile)
  }

  await tx.done
}
