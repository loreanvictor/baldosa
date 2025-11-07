import { onConnected, onDisconnected, currentNode } from 'minicomp'


export const broadcast = (event, detail) => {
  document.dispatchEvent(new CustomEvent(event, { detail }))
}

export const onBroadcast = (event, listener) => {
  const wrapped = event => listener(event.detail)

  if (currentNode() === undefined) {
    document.addEventListener(event, wrapped)
  } else {
    onConnected(() => document.addEventListener(event, wrapped))
    onDisconnected(() => document.removeEventListener(event, wrapped))
  }
}

export const listenToBroadcast = (event, listener, opts) => {
  const wrapped = event => listener(event.detail)
  document.addEventListener(event, wrapped, opts)
  return () => document.removeEventListener(event, wrapped)
}

export const waitForOneBroadcast = async (event) => {
  return new Promise((resolve) => {
    const wrapped = (e) => {
      resolve(e.detail)
    }
    document.addEventListener(event, wrapped, { once: true })
  })
}
