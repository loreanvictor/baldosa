const stack = []


export const push = (closeable, closer = true) => {
  const index = stack.length
  stack.push(closeable)

  closer && closeable.addEventListener('close', () => {
    stack.forEach((closeable, i) => {
      i > index && closeable.controls.close()
    })

    stack.length = index
  }, { once: true })
}
