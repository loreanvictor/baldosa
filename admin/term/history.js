export const makeHistory = (name) => {
  let history = []
  let cursor = -1
  const key = `${name} shell history`

  const reset = () => (cursor = -1)

  const load = () => {
    const stored = localStorage.getItem(key)
    stored && ((history = JSON.parse(stored)), reset())
  }

  const save = () => {
    localStorage.setItem(key, JSON.stringify(history))
  }

  const push = (command) => {
    history.push(command)
    reset()
    save()
  }

  const empty = () => history.length === 0

  const clear = () => {
    history = []
    reset()
    localStorage.removeItem(key)
  }

  const next = () => {
    if (cursor === history.length - 1 || cursor === -1) {
      reset()
      return ''
    } else {
      cursor++
      return history[cursor]
    }
  }

  const prev = () => {
    if (cursor === -1) {
      cursor = history.length - 1
    } else if (cursor > 0) {
      cursor--
    }

    return history[cursor]
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
  }
}
