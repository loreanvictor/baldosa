import { html } from 'rehtm'

import { account } from '../auth/index.js'
import { currentTerm, withTerm } from './context.js'
import { TermError } from './error.js'
import './components/textual.js'

const registry = {}

export const register = (cmd, fn) => (registry[cmd] = fn)

export const run = async (command, opts) => {
  const term = currentTerm()

  if (!opts?.silent) {
    term.append(
      html`<div>
        <t-prim><b>${account()?.name ?? ''}${'$'}</b></t-prim> ${opts?.input ?? command}
      </div>`,
    )
  }

  const [cmd, ...args] = command.split(' ').filter((c) => c !== '')
  if (cmd in registry) {
    try {
      await term.target(opts.target)
      return await withTerm(term, () => registry[cmd](...args))
    } catch (err) {
      if (err instanceof TermError) {
        err.display(term)
      } else {
        throw err
      }
    } finally {
      await term.target()
    }
  } else {
    term.log(html`<t-err>command ${cmd} not found.</t-err>`)
    term.log(html`<span>use \`<t-cp actionable>man</t-cp>\` to see all possible commands.</span>`)
  }
}

const completers = {}
export const registerCompleter = (cmd, fn) => (completers[cmd] = fn)

export const completer = (term) => {
  let search

  const reset = () => (search = undefined)
  const next = async (input) => {
    const [cmd, ...rest] = input.split(' ')
    const arg = rest.join(' ')
    const incmd = rest.length > 0
    if (!search) {
      if (incmd) {
        if (cmd in completers) {
          search = await withTerm(term, () => completers[cmd](arg))
        } else {
          search = []
        }
      } else {
        search = Object.keys(registry).filter((k) => k.startsWith(input))
      }
      if (search.length > 0) {
        const res = search[0]
        if (search.length === 1) {
          reset()
        }

        return incmd ? cmd + ' ' + res : res
      } else {
        search = undefined
      }
    } else {
      let index = incmd ? search.indexOf(arg) : search.indexOf(input)
      if (index !== -1) {
        index = index === search.length - 1 ? 0 : index + 1
        return incmd ? cmd + ' ' + search[index] : search[index]
      }
    }
  }

  return { next, reset }
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
        html`<k-v actionable onclick=${() => term.paste(`man ${cmd}`, true)}>
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
