import { html } from 'rehtm'

import { register } from '../registry.js'
import { currentTerm } from '../context.js'

const clear = async (...flags) => {
  const term = currentTerm()

  if (flags.includes('-h') || flags.includes('--history')) {
    await term.history?.clear()
  }

  if (flags.includes('-m') || flags.includes('--main')) {
    term.clearMain()
  } else if (flags.includes('-s') || flags.includes('--aside')) {
    term.clearAside()
  } else {
    term.clear()
  }
}

clear.desc = 'clears the shell'
clear.man = (term) => {
  term.log('use normally to clear the shell.')
  term.log('usage:')
  term.log(html`<pre>clear              clears terminal.</pre>`)
  term.log(html`<pre>clear -m           clears only the main panel.</pre>`)
  term.log(html`<pre>clear -s           clears only the side panel.</pre>`)
  term.log(html`<pre>clear -h           clears shell history as well.</pre>`)
}
register('clear', clear)
