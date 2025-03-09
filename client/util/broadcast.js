import { onConnected, onDisconnected } from 'https://esm.sh/minicomp'


export const broadcast = (event, detail) => {
  document.dispatchEvent(new CustomEvent(event, { detail }))
}

export const onBroadcast = (event, listener) => {
  const wrapped = event => listener(event.detail)
  onConnected(() => document.addEventListener(event, wrapped))
  onDisconnected(() => document.removeEventListener(event, wrapped))
}
