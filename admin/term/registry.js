import { html } from 'rehtm'

import { account } from '../auth/index.js'
import { currentTerm } from './context.js'
import { TermError } from './error.js'
import './textual.js'

const registry = {}

export const register = (cmd, fn) => {
  registry[cmd] = fn
}

export const run = async (command, opts) => {
  const term = currentTerm()

  if (!opts?.silent) {
    term.newline()
    term.log(
      html`<span
        ><t-prim><b>${account()?.name ?? ''}${'$'}</b></t-prim> ${command}</span
      >`,
    )
    term.newline()
  }

  const [cmd, ...args] = command.split(' ').filter((c) => c !== '')
  if (cmd in registry) {
    try {
      await registry[cmd](...args)
    } catch (err) {
      if (err instanceof TermError) {
        err.display(term)
      } else {
        console.error(err)
      }
    }
  } else {
    term.log(html`<t-err>command ${cmd} not found.</t-err>`)
    term.log(`run 'man' to see all possible commands.`)
  }
}

const man = (target) => {
  const term = currentTerm()

  if (target) {
    const fn = registry[target]
    if (fn) {
      term.log(
        html`<k-v>
          <t-hl slot="key"><b>${target}</b> </t-hl>${fn.desc ?? ''}
        </k-v>`,
      )
      fn.man && fn.man(term)
    } else {
      throw new TermError(`command ${target} not found.`)
    }
  } else {
    Object.entries(registry).forEach(([cmd, fn]) => {
      term.log(
        html`<k-v>
          <t-hl slot="key"><b>${cmd}</b></t-hl> ${fn.desc ?? ''}
        </k-v>`,
      )
    })
  }
}

man.desc = 'lists all possible commands.'
man.man = (term) => {
  term.log('usage:')
  term.log('man')
  term.log(`man ${'<cmd>'}`)
}

register('man', man)
