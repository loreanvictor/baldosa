import { currentTerm, currentPiped } from './context.js'
import { register } from './registry.js'
import { serialize } from './serialize.js'
import { replaceWithGhost } from './ghost.js'

const compile = (input) => {
  try {
    if (input.startsWith('/')) {
      const m = input.match(/^\/(.+)\/([a-z]*)$/i)
      if (!m) throw new Error()
      return new RegExp(m[1], m[2])
    }
    return new RegExp(input)
  } catch {
    throw new Error(`Invalid regex: ${input}`)
  }
}

const grep = (pattern, ...args) => {
  const term = currentTerm()
  const piped = currentPiped()
  const regex = compile(pattern)
  if (piped) {
    const root = piped.childNodes.length === 1 && piped.childNodes[0].hasAttribute('note') ? piped.childNodes[0] : piped
    ;[...root.childNodes]
      .filter((n) => {
        const serialized = serialize(n)

        return serialized.trim() !== '' && regex.test(serialized)
      })
      .forEach((n) => {
        replaceWithGhost(n)
        term.append(n)
      })
  } else {
    const lines = args.join(' ').split('\n')
    const match = lines.filter((line) => regex.test(line))

    match.forEach((line) => term.log(line))
  }
}

grep.desc = 'select matching input lines.'
grep.man = (term) => {
  term.log('usage:')
  term.log(
    'will search input lines using given regular expression, and only display the matching ones. it is useful to pipe another command into grep, like this:',
  )
  term.newline()
  term.log('users | grep gmail')
  term.newline()
  term.log('the regex is case sensitive by default. specify the flag to make it case insensitive:')
  term.newline()
  term.log('users | grep /gmail/i')
}
register('grep', grep)
