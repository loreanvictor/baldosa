import sleep from 'sleep-promise'
import { define, onAttribute, onConnected, onDisconnected, attachControls } from 'minicomp'
import { html, ref } from 'rehtm'

define('health-check', () => {
  const holder = ref()
  const name = ref()
  const time = ref()
  let url

  const check = async (delay = true) => {
    if (url) {
      delay && (await sleep(Math.random() * 4_000))
      holder.current.setAttribute('class', 'undefined')
      await sleep(Math.random() * 500)
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
    setTimeout(() => check(false), 500)
    interval = setInterval(check, 10_000)
  })

  onDisconnected(() => clearInterval(interval))

  return html`
    <style>
      @keyframes glow {
        from { box-shadow: box-shadow: 0 0 8px 1px var(--color); }
        to { box-shadow: 0 0 16px 3px var(--color); }
      }
      a {
        color: var(--fg);
        text-decoration: none;
      }
      [circle] {
        --color: var(--border);
        width: 1ex;
        height: 1ex;
        border-radius: 1ex;
        display: inline-block;
        background: var(--color);
        margin-right: 1ex;
        transition:
          background 0.2s,
          box-shadow 0.2s;

        .ok & {
          --color: var(--success);
        }

        .error & {
          --color: var(--error);
        }

        .ok &, .error & {
          animation: glow 3s alternate infinite;
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
