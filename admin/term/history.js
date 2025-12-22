export const makeHistory = (home, fspromise) => {
  const id = Math.random().toString(16).slice(2, 10)
  let history = []
  let rotation = history
  let cursor = -1
  const file = `${home}/.shell_history`
  let fs

  const reset = () => (cursor = -1)

  const load = () => {
    if (!home) {
      return
    }

    fspromise.then(async (_fs) => {
      fs = _fs
      try {
        await fs.mkdir(home)
        const stored = await fs.read(file)
        stored && ((rotation = history = stored.split('<br>')), reset())
      } catch {}
    })
  }

  const save = async () => {
    if (fs && !!home) {
      await fs.mkdir(home)
      await fs.write(file, history.join('<br>', 'commandline'))
    }
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

  const clear = async () => {
    rotation = history = []
    reset()
    if (fs && !!home) {
      await fs.rm(file)
    }
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
