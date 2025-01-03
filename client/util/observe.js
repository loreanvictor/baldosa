import { onDisconnected, onConnected } from 'https://esm.sh/minicomp'


export const observe = (target, event, callback, options) => {
  const element = target instanceof EventTarget ? target : document.querySelector(target)
  onConnected(() => element.addEventListener(event, callback, options))
  onDisconnected(() => element.removeEventListener(event, callback))
}
