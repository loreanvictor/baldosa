import { IMG_SIZES } from './constants.js'
import { createImageCache } from './cache.js'


export const createGallery = (cacheSize, ttl = 10_000) => {
  const cache = createImageCache(cacheSize, ttl)

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
    } else {
      const load = () => {
        try {
          cache.add(urls)
        } catch(err) {
          console.log(err.message)
        }
      }
      
      setTimeout(() => load(), 1)
    }
    
    return undefined
  }

  return { get }
}
