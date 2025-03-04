import { define, onAttribute, attachControls } from 'https://esm.sh/minicomp'
import { html, ref } from 'https://esm.sh/rehtm'


define('glass-toast', ({ time = 3000 }) => {
  const holder = ref()
  let timeout

  onAttribute('time', t => {
    if (t) {
      time = t
      clearTimeout(timeout)
      timeout = setTimeout(() => controls.close(), time)
    }
  })

  const controls = {
    open: () => {
      clearTimeout(timeout)
      holder.current.showPopover()
      timeout = setTimeout(() => controls.close(), time)
    },
    close: () => {
      holder.current.classList.add('closing')
      setTimeout(() => {
        holder.current.classList.remove('closing')
        clearTimeout(timeout)
        holder.current.hidePopover()
      }, 150)
    }
  }

  attachControls(controls)

  return html`
    <link rel="stylesheet" href="./client/design/glass-toast.css" />
    <output ref=${holder} popover='manual' onclick=${e => e.stopPropagation()}>
      <slot></slot>
      <close-pin onclick=${() => controls.close()}></close-pin>
    </output>
  `
})
