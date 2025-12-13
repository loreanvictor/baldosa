import { register } from '../term/index.js'

const exit = () => {
  window.location.href = '/'
}

exit.desc = 'closes the terminal.'
register('exit', exit)
