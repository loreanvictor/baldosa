import { register } from './registry.js'
import { currentTerm } from './context.js'

const echo = (...args) => {
  const text = args.join(' ')
  currentTerm().log(text)

  return text
}

echo.desc = 'echoes what it hears.'
register('echo', echo)
