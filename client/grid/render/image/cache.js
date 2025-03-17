import { IMG_SIZES } from './constants.js'
import { fetchImage } from './fetch.js'
import { createTopic } from '../../../util/topic.js'


// TODO: use Quick-LRU here instead of manually implementing
//       a cache mechanism. the performance should be analysed of course,
//       perhaps its better to first test on demo/picsum-infinite branch.
// NOTE: the max size of the cache can currently be modified after the fact,
//       but using the Quick-LRU library this wouldn't be possible, so we should
//       take this into account as well.

export const createImageCache = (size, ttl = 10_000) => {
  const cache = new Map()
  const { listen, notify } = createTopic()

  const add = (key, iurl) => {
    const record = { key, i: undefined, t: Date.now() }
    cache.set(key, record)
    load(record, 'i', iurl)
  }
  const find = key => touch(cache.get(key))
  const get = (record, size) => (size && isLoaded(record, size)) ? record[size] :
    (record.i === 'loading' ? undefined : record.i)
  const touch = record => record ? (record.t = Date.now(), record) : record
  const isLoaded = (record, size) => record[size] && record[size] !== 'loading'
  const isLoading = (record, size) => record[size] === 'loading'
  const load = (record, size, url) => {
    if (!record[size]) {
      record[size] = 'loading'
      setTimeout(async () => {
        if (record[size] && record[size] !== 'loading') {
          return
        }

        record[size] = 'loading'
        const img = await fetchImage(url)
        record[size] = img.bitmap
        if (img.meta) {
          record.meta ??= {}
          record.meta.title ??= img.meta.title
          record.meta.subtitle ??= img.meta.subtitle
          record.meta.link ??= img.meta.link
        }
        notify(record.key, size)
      }, 1)
    }
  }
  const clear = (record) => Object.keys(IMG_SIZES).forEach(size => {
    if (record[size] && record[size] !== 'loading') {
      record[size].close()
    }
  })

  const _cleanEntry = entry => {
    setTimeout(() => {
      clear(entry[1])
      cache.delete(entry[0])
    }, 1)
  }

  const cleaner = setInterval(() => {
    if (cache.size > size) {
      const entries = [...cache.entries()].sort((i, j) => i[1].t - j[1].t)
      const target = entries.slice(0, cache.size - size)
      target.forEach(_cleanEntry)
    } else {
      const now = Date.now()
      ;[...cache.entries()]
        .filter(i => now - i[1].t > ttl)
        .forEach(_cleanEntry)
    }
  }, 200)

  const dispose = () => {
    clearInterval(cleaner)
    cache.entries.forEach(entry => {
      clear(entry[1])
      cache.delete(entry[0])
    })
    cache.clear()
  }

  const limit = s => size = s

  const control = { add, find, get, touch, isLoaded, isLoading, load, clear, dispose, listen, limit }
  control[Symbol.dispose] = dispose

  return control
}
