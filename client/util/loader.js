export const loader = (cb, ...resources) => {
  const res = resources.reduce((acc, r) => ({ [r]: 0, ...acc }), {})

  return (resource, value = 1, msg = '') => {
    res[resource] = Math.min(1, value)
    cb(Object.values(res).reduce((acc, v, _, l) => acc + v / l.length, 0), msg)
  }
}
