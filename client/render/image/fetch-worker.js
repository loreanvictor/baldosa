self.onmessage = async ({ data }) => {
  const { url } = data

  try {
    const response = await fetch(url)
    if (response.ok) {
      const blob = await response.blob()
      const bitmap = await createImageBitmap(blob)

      self.postMessage({ url, bitmap }, [bitmap])
    } else {
      throw new Error(response.statusText)
    }
  } catch (error) {
    console.error('error in loading image ' + url)
    console.error(error)
    self.postMessage({ url, error: error.message })
  }
}
