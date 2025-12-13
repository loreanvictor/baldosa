import { register } from './registry.js'
import { currentTerm } from './context.js'

const echo = (...args) => {
  currentTerm().log(args.join(' '))
}

echo.desc = 'echoes what it hears.'
register('echo', echo)
