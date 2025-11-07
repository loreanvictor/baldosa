const worker = new Worker(new URL('./fetch-worker.js', import.meta.url), { type: 'module' })
const reqs = new Map()


worker.onmessage = ({ data }) => {
  const { url, error, bitmap, meta } = data
  if (reqs.has(url)) {
    if (error) {
      reqs.get(url).reject(error)
    } else {
      reqs.get(url).resolve({ bitmap, meta })
    }

    reqs.delete(url)
  }
}


export const fetchImage = async (url, reload) => {
  if (reqs.has(url)) {
    return reqs.get(url).promise
  }

  let res, rej
  const promise = new Promise((resolve, reject) => { res = resolve; rej = reject })
  reqs.set(url, { promise, resolve: res, reject: rej })

  worker.postMessage({ url, reload })

  return promise
}
