import { define } from 'minicomp'

define(
  'glass-pane',
  () => `
  <style>
    :host {
      background: linear-gradient(180deg, #ffffff22, #ffffff19);
      backdrop-filter: blur(4px) contrast(1.5) brightness(1.1);
      -webkit-backdrop-filter: blur(4px) contrast(1.5) brightness(1.1);
      box-shadow: 0 0 2px 1px #ffffff22,
        0 2px 8px 0 #00000022;
      color: #ffffff88;
    }
  </style>
  <slot></slot>
`,
)
