import { define, on, useDispatch, onAttribute, currentNode } from 'minicomp'
import { html } from 'rehtm'

import { serializeWith } from './serialize.js'

define(
  'k-v',
  () => html`
    <style>
      div {
        display: flex;
        gap: 2ex;
        span {
          width: 32ex;
        }

        &:hover {
          background: var(--fade-hl);
        }
      }
    </style>
    <div>
      <span>
        <slot name="key"></slot>
      </span>
      <slot></slot>
    </div>
  `,
)

serializeWith('k-v', (node, serialize) => {
  const key = node.querySelector('[slot=key]')
  const values = [...node.childNodes].filter((n) => n !== key)

  return `${serialize(key)} : ${values.map(serialize).join('')}`
})

define(
  't-err',
  () => html`
    <style>
      :host {
        color: var(--error);
      }
    </style>
    <slot></slot>
  `,
)

define(
  't-prim',
  () => html`
    <style>
      :host {
        color: var(--primary);
      }
    </style>
    <slot></slot>
  `,
)

define(
  't-sec',
  () => html`
    <style>
      :host {
        color: var(--secondary);
      }
    </style>
    <slot></slot>
  `,
)

define(
  't-succ',
  () => html`
    <style>
      :host {
        color: var(--success);
      }
    </style>
    <slot></slot>
  `,
)

define(
  't-warn',
  () => html`
    <style>
      :host {
        color: var(--warn);
      }
    </style>
    <slot></slot>
  `,
)

define(
  't-hl',
  () => html`
    <style>
      :host {
        color: var(--hl);
      }
    </style>
    <slot></slot>
  `,
)

define('t-cp', () => {
  const copy = useDispatch('shellpaste', { bubbles: true, composed: true })
  const self = currentNode()
  let content = undefined

  onAttribute('content', (c) => (content = c))
  on('click', (e) => {
    e.stopPropagation()
    copy({ content: content ?? self.textContent })
  })

  return html`
    <style>
      span {
        cursor: pointer;
        color: var(--tertiary);
        &:hover {
          background: var(--tertiary);
          color: var(--bg);
        }
      }
    </style>
    <span>
      <slot></slot>
    </span>
  `
})

define('t-cols', ({ layout, n }) => {
  currentNode().style.gridTemplateColumns = layout ?? '1fr '.repeat(n).trim()

  return html`
    <style>
      :host {
        display: grid;
        gap: 2ex;
      }

      ::slotted(*) {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    </style>
    <slot></slot>
  `
})

serializeWith('t-cols', (node, serialize) => [...node.childNodes].map(serialize).join(' | '))
