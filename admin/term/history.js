export const makeHistory = (name) => {
  let history = []
  let rotation = history
  let cursor = -1
  const key = `${name} shell history`

  const reset = () => (cursor = -1)

  const load = () => {
    const stored = localStorage.getItem(key)
    stored && ((rotation = history = JSON.parse(stored)), reset())
  }

  const save = () => {
    localStorage.setItem(key, JSON.stringify(history))
  }

  const push = (command) => {
    if (command !== history[history.length - 1]) {
      history.push(command)
      rotation = history
      reset()
      save()
    }
  }

  const empty = () => rotation.length === 0

  const clear = () => {
    history = []
    reset()
    localStorage.removeItem(key)
  }

  const next = () => {
    if (cursor === rotation.length - 1 || cursor === -1) {
      reset()
      return ''
    } else {
      cursor++
      return rotation[cursor] ?? ''
    }
  }

  const prev = () => {
    if (cursor === -1) {
      cursor = rotation.length - 1
    } else if (cursor > 0) {
      cursor--
    }

    return rotation[cursor] ?? ''
  }

  const search = (start) => {
    rotation = history.filter((h) => h.startsWith(start))

    reset()
    const result = prev()
    return prev()
  }

  const endsearch = () => {
    rotation = history
    reset()
  }

  load()

  return {
    reset,
    prev,
    next,
    push,
    save,
    clear,
    empty,
    search,
    endsearch,
  }
}
