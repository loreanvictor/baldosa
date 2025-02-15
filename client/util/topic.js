export const createTopic = () => {
  const listeners = []

  const listen = fn => {
    listeners.push(fn)
    return () => {
      listeners.splice(listeners.indexOf(fn), 1)
    }
  }

  const notify = (...args) => listeners.forEach(fn => fn(...args))

  return { listen, notify }
}
