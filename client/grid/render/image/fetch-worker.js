import createError from 'https://esm.run/http-errors@2'

const decodeDetails = (encoded) => {
  try {
    return JSON.parse(atob(encoded))
  } catch (error) {
    return undefined
  }
}

const decodeBase64 = (str) => {
  const bytes = Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const decodeMIME = (str) => {
  if (!str) return str

  const m = str.match(/^=\?([^?]+)\?Q\?([^?]+)\?=$/i)
  if (!m) return str // not MIME → return unchanged

  const [, charset, encoded] = m

  const qp = encoded.replace(/_/g, ' ').replace(/=([A-F0-9]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  const bytes = new Uint8Array([...qp].map((c) => c.charCodeAt(0)))
  const demimed = new TextDecoder(charset).decode(bytes)

  try {
    // sometimes it is double encoded, so double decode
    const bytes = Uint8Array.from(demimed, (c) => c.charCodeAt(0))
    return new TextDecoder(charset).decode(bytes, { fatal: true })
  } catch (err) {
    return demimed
  }
}

self.onmessage = async ({ data }) => {
  const { url, reload } = data

  const err = (error) => {
    console.error('error in loading image ' + url)
    console.error(error)
    self.postMessage({ url, error: error.toString() })
  }

  try {
    const response = reload ? await fetch(url, { cache: 'reload' }) : await fetch(url)
    if (response.ok) {
      const meta = {
        title: decodeMIME(response.headers.get('x-amz-meta-title')),
        subtitle: decodeMIME(response.headers.get('x-amz-meta-subtitle')),
        description: decodeBase64(response.headers.get('x-amz-meta-description') ?? ''),
        link: response.headers.get('x-amz-meta-link'),
        details: decodeDetails(response.headers.get('x-amz-meta-details') ?? ''),
      }
      const blob = await response.blob()
      const bitmap = await createImageBitmap(blob)

      self.postMessage({ url, bitmap, meta }, [bitmap])
    } else {
      err(createError(response.status, response.statusText))
    }
  } catch (error) {
    err(error)
  }
}
