import { define, attachControls, onAttribute } from 'minicomp'
import { ref, html } from 'rehtm'

import { withTerm } from './context.js'
import { makeHistory } from './history.js'
import { run, completer } from './registry.js'
import './input.js'
import './textual.js'
import './button.js'
import './clear.js'
import './tip.js'
import './env.js'

define('admin-terminal', () => {
  const result = ref()
  const aside = ref()
  const input = ref()
  let _target

  const toBottom = () => {
    result.current.scrollTo({ top: result.current.scrollHeight, behavior: 'smooth' })
  }

  const target = () => (_target === 'aside' ? aside.current : result.current)

  const term = {
    clear: () => ((result.current.innerHTML = ''), (aside.current.innerHTML = '')),
    log: (child) => (target().appendChild(html`<div log><div>${child}</div></div>`), toBottom()),
    append: (child) => (target().appendChild(child), toBottom()),
    aside: (child) => {
      aside.current.innerHTML = ''
      aside.current.appendChild(child)
    },
    read: (prompt, secret) => input.current.controls.read(prompt, secret),
    paste: (text, replace) => input.current.controls.paste(text, replace),
    newline: () => (target().appendChild(html`<br />`), toBottom()),
    run: (command, opts) => withTerm(term, () => run(command, opts)),
    name: (name) => {
      term.history = makeHistory(name)
      input.current.setAttribute('shellname', name)
      input.current.setProperty('history', term.history)
    },
    target: (t) => ((_target = t), t === 'aside' && (aside.current.innerHTML = '')),
    history: makeHistory(''),
    env: {},
  }

  attachControls(term)

  onAttribute('shellname', (name) => term.name(name ?? ''))

  return html`
    <style>
      :host {
        display: flex;
        gap: 4ex;

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

        & > div {
          min-width: 0;
          flex: 1 1 auto;

          & > pre {
            max-height: calc(80vh - 13ch);
            overflow: auto;
          }
        }

        & > aside {
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
            border-bottom: 1px solid var(--border);
          }

          @media screen and (max-width: 600px) {
            display: none;
          }
        }
      }

      [log] {
        white-space: normal;
        word-break: break-all;
      }
    </style>
    <div>
      <pre ref=${result}></pre>
      <main-input ref=${input} completer=${completer()} oncmd=${({ detail }) => term.run(detail)}></main-input>
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
