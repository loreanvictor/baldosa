import Cache from 'https://esm.sh/quick-lru'

import { createTopic } from '../../util/topic.js'


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
