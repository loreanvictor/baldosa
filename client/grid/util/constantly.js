import { onConnected, onDisconnected } from 'https://esm.sh/minicomp'


export const constantly = (fn, schedule = requestAnimationFrame) => {
  let connected = false

  const run = () => {
    if (connected) {
      fn()
      schedule(run)
    }
  }

  onConnected(() => {
    connected = true
    schedule(run)
  })

  onDisconnected(() => {
    connected = false
  })
}
