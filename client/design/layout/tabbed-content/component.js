import { define, attachControls, onConnected, currentNode } from 'minicomp'
import { ref, html } from 'rehtm'


define('tabbed-content', () => {
  const host = currentNode()
  const holder = ref()
  const selected = ref()

  const select = (tab, instant) => {
    if (instant) {
      selected.current?.removeAttribute('selected')
      tab.setAttribute('selected', true)
      selected.current = tab
    } else {
      holder.current.style.height = `${holder.current.offsetHeight}px`
      selected.current.style.opacity = 0
      tab.style.opacity = 0

      setTimeout(() => {
        selected.current?.removeAttribute('selected')
        tab.setAttribute('selected', true)
        selected.current = tab

        holder.current.getBoundingClientRect()
        holder.current.style.height = `calc(${tab.offsetHeight}px + 1.5ex)`

        requestAnimationFrame(() => tab.style.opacity = 1)
        setTimeout(() => holder.current.style.height = '', 200)
      }, 200)
    }
  }

  onConnected(() => {
    host.querySelectorAll('&>section').forEach(section => {
      if (section.hasAttribute('selected')) {
        select(section, true)
      }
    })
  })

  attachControls({ select })

  return html`
    <link rel='stylesheet' href='./client/design/layout/tabbed-content/styles.css' />
    <div class='holder' ref=${holder}>
      <slot></slot>
    </div>
  `
})
