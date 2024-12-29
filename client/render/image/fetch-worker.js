import createError from 'https://esm.sh/http-errors'


self.onmessage = async ({ data }) => {
  const { url } = data

  const err = (error) => {
    console.error('error in loading image ' + url)
    console.error(error)
    self.postMessage({ url, error: error.toString() })
  }

  try {
    const response = await fetch(url)
    if (response.ok) {
      const blob = await response.blob()
      const bitmap = await createImageBitmap(blob)

      self.postMessage({ url, bitmap }, [bitmap])
    } else {
      err(createError(response.status, response.statusText))
    }
  } catch (error) {
    err(error)
  }
}
