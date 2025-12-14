import { html } from 'rehtm'

import { register } from './registry.js'
import { currentTerm } from './context.js'
import './textual.js'

const TIPS = [
  'use <ctrl+r> to reverse i-search shell history.',
  'pipe command outputs to sidebar with `> aside`.',
  'use `env -s` to store secrets without storing them in the history.',
  'press <tab> key to autocomplete commands.',
  'drag the side bar (bottom left corner) to resize it.',
  'use `$ENV` variables in other commands.',
]

const tip = () => {
  const term = currentTerm()
  const t = TIPS[Math.floor(Math.random() * TIPS.length)]
  term.newline()
  term.log(html`<span><t-sec>TIP:</t-sec> <span>${t}</span></span>`)
  term.newline()
}

tip.desc = 'gives a random tip about the terminal.'
register('tip', tip)
