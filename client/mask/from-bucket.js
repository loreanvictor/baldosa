import Cache from 'https://esm.sh/quick-lru'

import { createTopic } from '../util/topic.js'


export const createGridMaskFromBucket = (options) => {
  const mapUrl = options.mapUrl
  const chunkSize = options.chunkSize ?? 256
  const cacheSize = options.cacheSize ?? 1000

  const cache = new Cache({ maxSize: cacheSize })
  const { listen, notify } = createTopic()

  const project = (x, y) => {
    const ex = Math.floor(x / chunkSize) * chunkSize
    const ey = Math.floor(y / chunkSize) * chunkSize

    return [`${ex}:${ey}`, ex, ey]
  }

  const load = (x, y) => {
    const [key, ex, ey] = project(x, y)

    if (!cache.has(key)) {
      cache.set(key, '')
      const _load = async() => {
        const response = await fetch(mapUrl(ex, ey))
        if (!response.ok && response.status !== 404 && response.status !== 403) {
          //
          // if we couldn't fetch the map
          // but NOT because the map possibly doesn't exist,
          // then we should delete the key so that we will
          // try again soon.
          //
          cache.delete(key)
        } else if (response.ok) {
          const bitmap = await response.arrayBuffer()
          const bytearray = new Uint8Array(bitmap)
          cache.set(key, bytearray)
          notify(ex, ey, ex + chunkSize, ey + chunkSize)
        }
      }

      _load()
    }
  }

  const has = (x, y) => {
    const [key, ex, ey] = project(x, y)
    if (cache.has(key)) {
      const bytes = cache.get(key)
      if (bytes === '') {
        return false
      } else {
        const lx = x - ex
        const ly = y - ey
        const bitpos = ly * chunkSize + lx
        const byteindex = Math.floor(bitpos / 8)
        const bitindex = bitpos % 8

        return (bytes[byteindex] & (1 << bitindex)) !== 0
      }
    } else {
      load(x, y)
    }
  }

  return { has, listen }
}

// ------------- debugging ------------- \\\

async function __debugHasTile(x, y) {
  const MapChunkSize = 256
  const ex = Math.floor(x / MapChunkSize) * MapChunkSize
  const ey = Math.floor(y / MapChunkSize) * MapChunkSize

  try {
      const response = await fetch(`https://dp5ho7dvg88z2.cloudfront.net/maps-${ex}-${ey}.bin`)
      if (!response.ok) return false

      const bitmap = await response.arrayBuffer()
      const localX = x - ex
      const localY = y - ey

      // Calculate bit position in the bitmap
      const bitPosition = localX + localY * MapChunkSize
      const byteIndex = Math.floor(bitPosition / 8)
      const bitOffset = bitPosition % 8

      // Safety check for bitmap bounds
      const bytes = new Uint8Array(bitmap)
      if (byteIndex >= bytes.length) return false

      // Check if the specific bit is set
      return (bytes[byteIndex] & (1 << bitOffset)) !== 0
  } catch (error) {
      console.error('Error checking tile:', error)
      return false
  }
}

window.__debugHasTile = __debugHasTile
