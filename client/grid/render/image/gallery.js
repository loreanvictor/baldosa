import { IMG_SIZES } from './constants.js'
import { createImageCache } from './cache.js'

export const createGallery = (baseUrl, cacheSize, ttl = 10_000) => {
  const cache = createImageCache(cacheSize, ttl)
  const getUrl = (x, y, size) => baseUrl + `/tile-${x}-${y}-${size}.jpg`

  const get = (x, y, scale) => {
    const key = `${x}:${y}`
    let hit = cache.find(key)
    if (hit) {
      const sizes = Object.keys(IMG_SIZES)
      const target = sizes.reduce((curr, candidate) =>
        IMG_SIZES[curr] < IMG_SIZES[candidate] && IMG_SIZES[curr] < scale ? candidate : curr,
      )

      cache.load(hit, target, getUrl(x, y, IMG_SIZES[target]))

      const available = cache.isLoaded(hit, target)
        ? target
        : sizes.reduce((curr, candidate) =>
            cache.isLoaded(hit, candidate) && IMG_SIZES[candidate] >= (IMG_SIZES[curr] ?? 1) && IMG_SIZES[curr] < scale
              ? candidate
              : curr,
          )

      return { bitmap: cache.get(hit, available), meta: hit.meta }
    } else {
      const load = () => {
        try {
          cache.add(key, getUrl(x, y, IMG_SIZES['i']))
        } catch (err) {
          console.log(err.message)
        }
      }

      setTimeout(() => load(), 1)
    }

    return undefined
  }

  const patch = (x, y, meta) => {
    const key = `${x}:${y}`
    cache.patch(key, meta, (s) => getUrl(x, y, IMG_SIZES[s]))
  }

  const listen = (listener) => cache.listen(listener)
  const limit = (size) => cache.limit(size)
  const dispose = () => cache.dispose()
  const control = { get, listen, limit, dispose, patch }
  control[Symbol.dispose] = dispose

  return control
}
