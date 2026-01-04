import { define } from 'minicomp'

define(
  'glass-pane',
  () => `
  <style>
    :host {
      background: #42424244;
      backdrop-filter: blur(6px) contrast(1.2);
      -webkit-backdrop-filter: blur(6px) contrast(1.2);
      box-shadow: 0 0 1px 1px #ffffff22;
      color: #ffffff88;
    }
  </style>
  <slot></slot>
`,
)
