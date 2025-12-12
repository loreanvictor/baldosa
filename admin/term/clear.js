import { register } from './registry.js'
import { currentTerm } from './context.js'

const clear = (...flags) => {
  const term = currentTerm()
  term.clear()

  if (flags.includes('-h') || flags.includes('--history')) {
    term.history?.clear()
  }
}

clear.desc = 'clears the shell'
clear.man = (term) => {
  term.log('use normally to clear the shell. use with -h or --history to also clear shell history.')
}
register('clear', clear)
