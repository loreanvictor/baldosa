import { define, onProperty, onAttribute, currentNode } from 'minicomp'
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
    <span onclick=${(e) => (e.stopPropagation(), term?.paste(content ?? self.textContent))}>
      <slot></slot>
    </span>
  `
})

define(
  'col-2',
  ({ layout }) => html`
    <style>
      :host > div {
        display: grid;
        grid-template-columns: ${layout ?? '1fr 1fr'};
        gap: 2ex;
        & > div {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        &:hover {
          background: var(--fade-hl);
        }
      }
    </style>
    <div style=${`grid-template-columns: ${layout ?? '1fr 1fr'}`}>
      <div><slot name="left"></slot></div>
      <div><slot name="right"></slot></div>
    </div>
  `,
)

define(
  'col-3',
  ({ layout }) => html`
    <style>
      :host > div {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 2ex;
        & > div {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        &:hover {
          background: var(--fade-hl);
        }
      }
    </style>
    <div style=${`grid-template-columns: ${layout ?? '1fr 1fr 1fr'}`}>
      <div><slot name="left"></slot></div>
      <div><slot name="middle"></slot></div>
      <div><slot name="right"></slot></div>
    </div>
  `,
)
