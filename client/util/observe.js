import { onDisconnected, onConnected, currentNode } from 'https://esm.sh/minicomp'


const query = selector => {
  const indoc = document.querySelector(selector)
  if (indoc) { return indoc }

  let root = currentNode()
  while (root) {
    const inroot = root.querySelector(selector)
    if (inroot) { return inroot }

    root = root.getRootNode()
  }
}

export const observe = (target, event, callback, options) => {
  const element = target instanceof EventTarget ? target : query(target)

  if (element) {
    onConnected(() => element.addEventListener(event, callback, options))
    onDisconnected(() => element.removeEventListener(event, callback))
  } else {
    throw new Error(`target ${target} not found.`)
  }
}
