import { define, onProperty, currentNode } from 'minicomp'
import { html } from 'rehtm'

import { currentTerm } from './context.js'

define(
  'k-v',
  () => html`
    <style>
      div {
        display: flex;
        span {
          width: 32ex;
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

  onProperty('term', (t) => (term = t))

  return html`
    <style>
      span {
        cursor: pointer;
        &:hover {
          background: var(--fg);
          color: var(--bg);
        }
      }
    </style>
    <span onclick=${() => term?.paste(self.textContent)}>
      <slot></slot>
    </span>
  `
})
