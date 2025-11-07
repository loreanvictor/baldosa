import { define } from 'minicomp'


define('status-plaque', () => {
  return `
    <link rel="stylesheet" href="./client/design/display/status-plaque/styles.css" />
    <div class="holder">
      <div class="icon">
        <slot name="icon"></slot>
      </div>
      <div class="content">
        <slot></slot>
      </div>
    </div>
  `
})
