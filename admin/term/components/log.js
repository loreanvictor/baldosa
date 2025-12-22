import { define, currentNode, on } from 'minicomp'
import { html } from 'rehtm'

import { serializeWith } from '../util/serialize.js'

define('t-log', () => {
  const host = currentNode()
  host.tabIndex = -1
  on('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const root = host.getRootNode()
      const items = Array.from(root.querySelectorAll(host.tagName))
      const index = items.indexOf(host)
      const next = e.key === 'ArrowUp' ? items[index - 1] : items[index + 1]
      if (next) {
        e.preventDefault()
        next.focus()
      } else if (index === items.length - 1) {
        root.querySelector('main-input')?.controls.focus()
      }
    } else if (e.key === 'Enter' || e.key === 'Space') {
      host.querySelector('[actionable]')?.click()
    }
  })

  on('focus', () => {
    host.querySelector('[focusaction]')?.click()
  })

  return html`
    <style>
      :host {
        display: block;
        white-space: normal;
        word-break: break-all;
        border-left: 0.5rem solid var(--fade-hl);
        padding-left: 0.5rem;
      }

      :host(:hover) {
        background: var(--fade-hl);
      }

      :host(:focus) {
        outline: none;
        border-color: var(--tertiary);
        background: var(--fade-hl);
      }
    </style>
    <slot></slot>
  `
})

serializeWith('t-log', (node, serialize) => `${[...node.childNodes].map(serialize).join('')}\n`)
