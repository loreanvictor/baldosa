import createError from 'https://esm.run/http-errors@2'
import { decode as decodeBase64 } from 'https://esm.run/js-base64@3'

const decodeDetails = (encoded) => {
  try {
    return JSON.parse(atob(encoded))
  } catch (error) {
    return undefined
  }
}

const decodeMIME = (str) => {
  if (!str) return str

  // Find all encoded-words (Q or B)
  return str.replace(/=\?([^?]+)\?([QBqb])\?([^?]+)\?=/g, (_, charset, enc, data) => {
    const isQ = enc.toUpperCase() === 'Q'

    let bytes
    if (isQ) {
      // Quoted-printable inside encoded-word
      const qp = data.replace(/_/g, ' ').replace(/=([A-F0-9]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
      bytes = Uint8Array.from(qp, (c) => c.charCodeAt(0))
    } else {
      // Base64
      const bin = atob(data)
      bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    }

    let decoded = ''
    try {
      decoded = new TextDecoder(charset).decode(bytes)
    } catch {
      // Fallback — invalid charset or bad bytes
      decoded = [...bytes].map((b) => String.fromCharCode(b)).join('')
    }

    // Optional second-pass decode for Latin-1-misinterpreted UTF-8
    try {
      const doubleBytes = Uint8Array.from(decoded, (c) => c.charCodeAt(0))
      return new TextDecoder(charset).decode(doubleBytes)
    } catch {
      return decoded
    }
  })
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
