import { define } from 'minicomp'

define(
  'glass-pane',
  () => `
  <style>
    :host {
      background: linear-gradient(180deg, #ffffff42, #ffffff32);
      backdrop-filter: blur(8px) contrast(1.5) brightness(1.1);
      -webkit-backdrop-filter: blur(8px) contrast(1.5) brightness(1.1);
      box-shadow: 0 0 0 1px #ffffff32,
        0 2px 8px 0 #00000022;
      color: #ffffff88;
    }
  </style>
  <slot></slot>
`,
)
