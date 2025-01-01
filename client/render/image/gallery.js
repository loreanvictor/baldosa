import { IMG_SIZES } from './constants.js'
import { createImageCache } from './cache.js'


export const createGallery = (cacheSize, ttl = 10_000) => {
  const cache = createImageCache(cacheSize, ttl)
  const loading = {}

  const get = (urls, scale) => {
    let hit = cache.find(urls)
    if (hit) {
      const sizes = Object.keys(IMG_SIZES).filter(size => size in urls)
      const target = sizes.reduce(
        (curr, candidate) =>
           (IMG_SIZES[curr] < IMG_SIZES[candidate] && IMG_SIZES[curr] < scale)
           ? candidate : curr
      )

      cache.load(hit, target, urls)
      
      const available = cache.isLoaded(hit, target) ? target :
        sizes.reduce(
          (curr, candidate) => (
            cache.isLoaded(hit, candidate) &&
            IMG_SIZES[candidate] >= (IMG_SIZES[curr] ?? 1) &&
            IMG_SIZES[curr] < scale
          ) ? candidate : curr
        )
      
      return cache.get(hit, available)
    } else if (!loading[urls.i]) {
      loading[urls.i] = true
      const load = async() => {
        try {
          await cache.add(urls)
        } catch(err) {
          console.log(err.message)
        } finally {
          delete loading[urls.i]
        }
      }
      
      setTimeout(() => load(), 1)
    }
    
    return undefined
  }

  return { get }
}
