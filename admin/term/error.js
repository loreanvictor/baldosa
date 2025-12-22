import { html } from 'rehtm'

import './components/textual.js'

export class TermError extends Error {
  constructor(message, hint) {
    super(message)
    this.hint = hint
  }

  display(term) {
    term.log(html`<t-err><b>ERROR:</b> ${this.message}</t-err>`)
    this.hint && term.log(this.hint)
  }
}
