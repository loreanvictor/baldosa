const worker = new Worker('client/render/image/fetch-worker.js', { type: 'module' })
const reqs = new Map()


worker.onmessage = ({ data }) => {
  const { url, error, bitmap } = data
  if (reqs.has(url)) {
    if (error) {
      reqs.get(url).reject(error)
    } else {
      reqs.get(url).resolve(bitmap)
    }

    reqs.delete(url)
  }
}


export const fetchImage = async url => {
  if (reqs.has(url)) {
    return reqs.get(url).promise
  }

  let res, rej
  const promise = new Promise((resolve, reject) => { res = resolve; rej = reject })
  reqs.set(url, { promise, resolve: res, reject: rej })

  worker.postMessage({ url })

  return promise
}
