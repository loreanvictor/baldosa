import { define, useDispatch, attachControls, onAttribute, onProperty } from 'minicomp'
import { html, ref } from 'rehtm'

define('main-input', () => {
  const cmd = useDispatch('cmd')
  const defocus = useDispatch('defocus')
  const holder = ref()
  const input = ref()
  const suggestion = ref()
  const prefix = ref()
  let shellname = ''
  let mode = 'cmd'
  let readres
  let readrej
  let history
  let completer

  onAttribute('shellname', (name) => ((shellname = name ?? ''), setpref()))
  onProperty('history', (h) => (history = h))
  onProperty('completer', (c) => (completer = c))

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
    }
  }

  const endsearch = () => {
    suggestion.current.textContent = ''
    input.current.setAttribute('placeholder', 'enter a command ...')
    history.endsearch()
  }

  const onkeydown = (e) => {
    const command = input.current?.value.trim()
    if (e.key === 'Tab' && mode === 'cmd' && completer) {
      e.preventDefault()
      if (e.shiftKey) {
        defocus()
      } else {
        const suggestion = completer.next(command)
        suggestion && (input.current.value = suggestion)
      }
    } else if (e.key === 'Enter' && command !== '') {
      e.preventDefault()
      history?.reset()
      if (mode === 'cmd') {
        history?.push(command)
        cmd(command)
        input.current.value = ''
      } else if (mode === 'read') {
        endread(input.current.value)
        input.current.value = ''
        setmode('cmd')
        setpref()
      } else if (mode === 'search') {
        if (suggestion.current.textContent.length > 0) {
          input.current.value = suggestion.current.textContent
        }

        setmode('cmd')
        endsearch()
        setpref()
      }
    } else if (mode === 'cmd' && e.key === 'ArrowUp' && history && !history.empty()) {
      e.preventDefault()
      input.current.value = history.prev()
    } else if (mode === 'cmd' && e.key === 'ArrowDown' && history && !history.empty()) {
      e.preventDefault()
      input.current.value = history.next()
    } else if (mode === 'search' && e.key === 'ArrowUp' && history && !history.empty()) {
      e.preventDefault()
      suggestion.current.textContent = history.prev()
    } else if (mode === 'search' && e.key === 'ArrowDown' && history && !history.empty()) {
      e.preventDefault()
      suggestion.current.textContent = history.next()
    } else if (mode === 'search' && e.key === 'ArrowRight') {
      if (suggestion.current.textContent.length > 0) {
        input.current.value = suggestion.current.textContent
        setmode('cmd')
        setpref()
        endsearch()
      }
    } else if (e.key === 'Escape' || (e.key.toLowerCase() === 'c' && (e.ctrlKey || e.metaKey))) {
      input.current.value = ''
      endread()
      endsearch()
      setpref()
      setmode('cmd')
    } else if (e.key.toLowerCase() === 'r' && (e.ctrlKey || e.metaKey)) {
      setmode('search')
      setpref('reverse i-search')
      input.current.setAttribute('placeholder', '')
    }
  }

  const oninput = () => {
    completer?.reset()
    if (mode === 'search') {
      suggestion.current.textContent = history.search(input.current.value.trim())
    }
  }

  const setmode = (m) => holder.current.setAttribute('mode', (mode = m))

  attachControls({
    read: (prompt, secret) => {
      setmode('read')
      setpref(prompt)
      secret && input.current.setAttribute('type', 'password')
      input.current.setAttribute('placeholder', '')

      return new Promise((res, rej) => ((readres = res), (readrej = rej)))
    },
    paste: (text, replace) => {
      if (replace || input.current.value.trim() === '') {
        input.current.value = text
      } else {
        input.current.value = input.current.value.trim() + ' ' + text.trim()
      }
      input.current.focus()
    },
    focus: () => input.current.focus(),
  })

  return html`
    <style>
      [holder] {
        display: flex;
        position: relative;
        gap: 1ex;
        align-items: baseline;
        & > [prefix] {
          color: var(--primary);
          font-weight: bold;
        }
        & > [inputbox] {
          flex-grow: 1;
          position: relative;

          & > [suggestion] {
            position: absolute;
            opacity: .5;
          }

          & > input {
            width: 100%;
            padding: 0;
            margin: 0;
            border: none;
            background: var(--bg);
            color: var(--hl);
            font-family: var(--font);
            font-size: 1rem;
            outline: none;
            resize: none;
          }
        }

        &[mode='read'] {
          margin-top: 0;
          &>span {
            color: var(--secondary);
          }
        }
        &[mode='search']>span {
          color: var(--secondary);
        }
      }
    </style>
    <div holder ref=${holder}>
      <span prefix ref=${prefix}>$</span>
      <div inputbox>
        <span suggestion ref=${suggestion}></span>
        <input
          ref=${input}
          onkeydown=${onkeydown}
          oninput=${oninput}
          autofocus
          type="text"
          placeholder="enter a command ..."
        ></input>
      </div>
    </div>
  `
})
