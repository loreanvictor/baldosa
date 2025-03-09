import { onDisconnected, onConnected, currentNode } from 'https://esm.sh/minicomp'
import { isRef } from 'https://esm.sh/rehtm'


const query = selector => {
  const indoc = document.querySelector(selector)
  if (indoc) { return indoc }

  let root = currentNode()
  while (root) {
    const inroot = root.querySelector(selector)
    if (inroot) { return inroot }

    const newroot = root.getRootNode()
    if (newroot === root) {
      if (root.host) {
        root = root.host
      } else {
        return
      }
    } else {
      root = newroot
    }
  }
}

export const observe = (target, event, callback, options) => {
  const element = isRef(target)? target :
    target instanceof EventTarget ? target :
      query(target)

  if (element) {
    onConnected(() => (isRef(target) ? target.current : element).addEventListener(event, callback, options))
    onDisconnected(() => (isRef(target) ? target.current : element).removeEventListener(event, callback))
  } else {
    throw new Error(`target ${target} not found.`)
  }
}

