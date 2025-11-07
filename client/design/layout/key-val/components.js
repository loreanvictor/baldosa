import { define, onAttribute } from 'minicomp'
import { ref, html } from 'rehtm'


define('key-val', () => {
  const val = ref()

  onAttribute('value', v => {
    val.current.textContent = v
  })

  return html`
    <link rel='stylesheet' href='./client/design/layout/key-val/styles.css' />
    <div>
      <label><slot></slot></label>
      <p>
        <span ref=${val}>0</span>
        <slot name='icon'></slot>
      </p>
    </div>
  `
})


define('key-vals', () => {
  return html`
    <link rel='stylesheet' href='./client/design/layout/key-val/styles.css' />
    <section>
      <slot></slot>
    </section>
  `
})
