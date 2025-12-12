import sleep from 'sleep-promise'
import { define, onAttribute, onConnected, onDisconnected, attachControls } from 'minicomp'
import { html, ref } from 'rehtm'

define('health-check', () => {
  const holder = ref()
  const name = ref()
  const time = ref()
  let url

  const check = async () => {
    if (url) {
      holder.current.setAttribute('class', 'undefined')
      await sleep(Math.random() * 400)
      const start = Date.now()
      let ok = false
      try {
        const res = await fetch(url)
        ok = res.ok
      } catch {}
      const end = Date.now()

      if (ok) {
        holder.current.setAttribute('class', 'ok')
        time.current.textContent = `(${end - start}ms)`
      } else {
        holder.current.setAttribute('class', 'error')
        time.current.textContent = ''
      }
    }
  }

  onAttribute('name', (n) => (name.current.textContent = n))
  onAttribute('url', (u) => {
    url = u
    if (!url) {
      holder.current.setAttribute('class', 'undefined')
      time.current.textContent = ''
    }

    name.current.href = url
  })

  let interval
  onConnected(() => {
    interval = setInterval(check, 1400)
  })

  onDisconnected(() => clearInterval(interval))

  return html`
    <style>
      a {
        color: var(--fg);
        text-decoration: none;
      }
      [circle] {
        width: 1ex;
        height: 1ex;
        border-radius: 1ex;
        display: inline-block;
        background: var(--border);
        margin-right: 1ex;
        transition:
          background 0.1s,
          box-shadow 0.1s;

        .ok & {
          background: var(--success);
          box-shadow: 0 0 8px 1px var(--success);
        }

        .error & {
          background: var(--error);
          box-shadow: 0 0 8px 1px var(--error);
        }
      }

      [time] {
        opacity: 0.5;
      }
    </style>
    <span ref=${holder}>
      <span circle></span>
      <a ref=${name} target="_blank"></a>
      <span time ref=${time}></span>
    </span>
  `
})
