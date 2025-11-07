import { define, onConnected, onDisconnected } from 'minicomp'
import { ref, html } from 'rehtm'

import { eta } from '../../util/format.js'


define('e-ta', ({ time, short }) => {
  const holder = ref()

  let interval

  const update = () => holder.current.textContent = eta(time, short)
  onConnected(() => (update(), interval = setInterval(update, 60_000)))
  onDisconnected(() => clearInterval(interval))

  return html`<output ref=${holder}></output>`
})
