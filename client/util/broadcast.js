import { onConnected, onDisconnected } from 'minicomp'


export const broadcast = (event, detail) => {
  document.dispatchEvent(new CustomEvent(event, { detail }))
}

export const onBroadcast = (event, listener) => {
  const wrapped = event => listener(event.detail)
  onConnected(() => document.addEventListener(event, wrapped))
  onDisconnected(() => document.removeEventListener(event, wrapped))
}

export const listenToBroadcast = (event, listener) => {
  const wrapped = event => listener(event.detail)
  document.addEventListener(event, wrapped)
  return () => document.removeEventListener(event, wrapped)
}
