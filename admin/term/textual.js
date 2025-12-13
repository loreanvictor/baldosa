import { define, on, onProperty, onAttribute, currentNode } from 'minicomp'
import { html } from 'rehtm'

import { currentTerm } from './context.js'

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
  const self = currentNode()
  let term = currentTerm()
  let content = undefined

  onProperty('term', (t) => (term = t))
  onAttribute('content', (c) => (content = c))
  on('click', (e) => (e.stopPropagation(), term?.paste(content ?? self.textContent)))

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
