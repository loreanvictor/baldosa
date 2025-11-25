import createError from "https://esm.run/http-errors@2"

const parseDetails = (encoded) => {
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

self.onmessage = async ({ data }) => {
  const { url, reload } = data

  const err = (error) => {
    console.error("error in loading image " + url)
    console.error(error)
    self.postMessage({ url, error: error.toString() })
  }

  try {
    const response = reload ? await fetch(url, { cache: "reload" }) : await fetch(url)
    if (response.ok) {
      const meta = {
        title: response.headers.get("x-amz-meta-title"),
        subtitle: response.headers.get("x-amz-meta-subtitle"),
        description: decodeBase64(response.headers.get("x-amz-meta-description") ?? ""),
        link: response.headers.get("x-amz-meta-link"),
        details: parseDetails(response.headers.get("x-amz-meta-details") ?? ""),
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
