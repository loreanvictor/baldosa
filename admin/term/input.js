import { define, useDispatch, attachControls, onAttribute, onProperty } from 'minicomp'
import { html, ref } from 'rehtm'

define('main-input', () => {
  const holder = ref()
  const input = ref()
  const prefix = ref()
  const cmd = useDispatch('cmd')
  let shellname = ''
  let mode = 'cmd'
  let readres
  let readrej
  let history

  onAttribute('shellname', (name) => ((shellname = name), setpref()))
  onProperty('history', (h) => (history = h))

  const setpref = (pref) => {
    prefix.current.textContent = pref ? `${pref}:` : `${shellname}$`
  }

  const endread = (text) => {
    if (readres && readrej) {
      if (text) {
        readres(text)
      } else {
        readrej('read cancelled')
      }

      readres = readrej = undefined
      input.current.setAttribute('type', 'text')
      input.current.setAttribute('placeholder', 'enter a command ...')
      setpref()
      mode = 'cmd'
      holder.current.setAttribute('mode', mode)
    }
  }

  const keydown = (e) => {
    const command = input.current?.value.trim()
    if (e.key === 'Enter' && command !== '') {
      e.preventDefault()
      history?.reset()
      if (mode === 'cmd') {
        history?.push(command)
        cmd(command)
      } else if (mode === 'read') {
        endread(input.current.value)
      }
      input.current.value = ''
    } else if (mode === 'cmd' && e.key === 'ArrowUp' && history && !history.empty()) {
      input.current.value = history.prev()
    } else if (mode === 'cmd' && e.key === 'ArrowDown' && history && !history.empty()) {
      input.current.value = history.next()
    } else if (e.key === 'Escape' || (e.key.toLowerCase() === 'c' && (e.ctrlKey || e.metaKey))) {
      input.current.value = ''
      endread()
    }
  }

  attachControls({
    read: (prompt, secret) => {
      mode = 'read'
      holder.current.setAttribute('mode', mode)
      setpref(prompt)
      secret && input.current.setAttribute('type', 'password')
      input.current.setAttribute('placeholder', '')

      return new Promise((res, rej) => ((readres = res), (readrej = rej)))
    },
    paste: (text, replace) => {
      if (replace || input.current.value.trim() === '') {
        input.current.value = text
      } else {
        input.current.value += ' ' + text
      }
      input.current.focus()
    },
  })

  return html`
    <style>
      div {
        display: flex;
        gap: 1ex;
        align-items: baseline;
        margin-top: 2ch;
        & > span {
          color: var(--primary);
          font-weight: bold;
        }
        & > input {
          padding: 0;
          margin: 0;
          flex-grow: 1;
          border: none;
          background: var(--bg);
          color: var(--hl);
          font-family: var(--font);
          font-size: 1rem;
          outline: none;
          resize: none;
        }

        &[mode='read'] {
          margin-top: 0;
          &>span {
            color: var(--hl);
          }
        }
      }
    </style>
    <div ref=${holder}>
      <span ref=${prefix}>$</span>
      <input
        ref=${input}
        onkeydown=${keydown}
        autofocus
        type="text"
        placeholder="enter a command ..."
      ></input>
    </div>
  `
})
