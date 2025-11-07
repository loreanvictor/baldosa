const config = {}

export const configure = (obj) => {
  for (const key in obj) {
    config[key] = obj[key]
  }
}

export const conf = key => {
  return config[key]
}
