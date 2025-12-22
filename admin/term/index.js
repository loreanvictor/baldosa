import { define, on, attachControls, onAttribute } from 'minicomp'
import { ref, html } from 'rehtm'

import { makeNotes } from './commands/notes.js'
import { expand } from './commands/env.js'
import { withTerm } from './context.js'
import { makeHistory } from './history.js'
import { serialize } from './util/serialize.js'
import { run, completer } from './registry.js'
import './input.js'

import './components/log.js'
import './commands/echo.js'
import './commands/grep.js'
import './commands/clear.js'
import './commands/tip.js'
import './commands/env.js'
import './commands/notes.js'
import './commands/fs.js'

define('admin-terminal', () => {
  const result = ref()
  const aside = ref()
  const input = ref()
  let _target = 'main'

  const toBottom = () => {
    requestAnimationFrame(() => result.current.scrollTo({ top: result.current.scrollHeight, behavior: 'smooth' }))
  }

  const target = () => (_target === 'aside' ? aside.current : _target === 'main' ? result.current : _target)
  const resolveInners = async (cmd, opts) => {
    let input = cmd
    const re = /\$\(([^()]+)\)/
    while (true) {
      const match = input.match(re)
      if (!match) break

      const result = await term.run(match[1].trim(), { ...opts, silent: true, target: 'null' })
      input = input.replace(match[0], result)
    }

    return input
  }

  let plugfs
  const fs = new Promise((resolve) => (plugfs = resolve))

  const term = {
    clear: () => (term.clearMain(), term.clearAside()),
    clearMain: () => (result.current.innerHTML = ''),
    clearAside: () => (aside.current.innerHTML = ''),
    log: (child) => (target()?.appendChild(html`<t-log>${child}</t-log>`), toBottom()),
    append: (child) => (target()?.appendChild(child), toBottom()),
    fs: () => fs,
    plugfs,
    on: async (holder, fn) => {
      const _t = target()
      await term.target(holder)
      _t.appendChild(holder)
      try {
        fn()
      } finally {
        await term.target()
      }
    },
    aside: (child) => {
      aside.current.innerHTML = ''
      aside.current.appendChild(child)
    },
    read: (prompt, secret) => input.current.controls.read(prompt, secret),
    paste: (text, replace) => input.current.controls.paste(text, replace),
    newline: () => (target()?.appendChild(html`<br />`), toBottom()),
    hr: () => (target()?.appendChild(html`<hr />`), toBottom()),
    run: async (command, opts) => {
      const expanded = withTerm(term, () => expand(command))
      const resolved = await resolveInners(expanded, opts)
      const [cmd, target] = resolved.split('>').map((_) => _.trim())

      const pipes = cmd.split('|').map((_) => _.trim())
      let piped = ''
      let res = undefined
      let pad

      for (let i = 0; i < pipes.length; i++) {
        const last = i === pipes.length - 1
        const c = (pipes[i] + ' ' + piped).trim()
        const prevpad = pad
        res = await withTerm(
          term,
          () =>
            run(c, {
              ...opts,
              silent: last ? opts?.silent : true,
              target: last ? (target ?? opts?.target) : (pad ??= document.createElement('div')),
              input: command,
            }),
          { piped: prevpad },
        )
        pad && (piped = serialize(pad))
      }

      return res
    },
    name: (name) => {
      term.home = `/home/${name.split(' ').join('-')}`
      term.cwd = term.home
      term.history = makeHistory(term.home, fs)
      input.current.setAttribute('shellname', name)
      input.current.setProperty('history', term.history)
    },
    target: async (t) => {
      if (!t || t === 'main') {
        _target = 'main'
      } else if (t === 'null') {
        _target = 'null'
      } else if (t === 'aside') {
        aside.current.innerHTML = ''
        _target = 'aside'
      } else if (t instanceof DocumentFragment) {
        _target = t.firstChild
      } else if (typeof t === 'string') {
        _target = await term.notes.note(t, true)
        console.log(_target)
      } else {
        _target = t
      }
    },
    history: makeHistory(undefined, fs),
    notes: makeNotes(() => term),
    env: {},
    cwd: '/',
    home: '/',
  }

  attachControls(term)

  onAttribute('shellname', (name) => term.name(name ?? ''))
  on('shellpaste', ({ detail }) => term.paste(detail.content, detail.replace))

  return html`
    <style>
      :host {
        display: flex;
        gap: 4ex;
      }

      hr {
        border: none;
        background: var(--border);
        height: 1.5px;
      }

      pre {
        margin: 0;
        padding: 0;
      }

      *::selection {
        background: var(--hl);
        color: var(--bg);
      }

      a {
        color: var(--fg);
      }

      #main {
        min-width: 0;
        flex: 1 1 auto;

        & > pre {
          max-height: calc(80vh - 13ch);
          overflow: auto;
        }
      }

      aside {
        width: 30vw;
        min-width: 20vw;
        max-width: 50vw;
        height: calc(80vh - 10ch);
        flex-shrink: 0;
        padding-left: 4ex;
        border-left: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: 2ch;
        resize: horizontal;
        overflow: auto;
        direction: rtl;

        & > * {
          direction: ltr;
        }

        & > div:first-child {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          padding-bottom: 2ch;
          border-bottom: 1px solid var(--border);
        }

        @media screen and (max-width: 600px) {
          display: none;
        }
      }
    </style>
    <div id="main">
      <pre ref=${result}></pre>
      <main-input
        ref=${input}
        completer=${completer(term)}
        ondefocus=${() => [...result.current.querySelectorAll('t-log')].at(-1)?.focus()}
        oncmd=${({ detail }) => term.run(detail)}
      >
      </main-input>
    </div>
    <aside>
      <div ref=${aside}></div>
      <div>
        <slot name="status-bar"></slot>
      </div>
    </aside>
  `
})

export { currentTerm, withTerm } from './context.js'
export { register } from './registry.js'
export { TermError } from './error.js'
