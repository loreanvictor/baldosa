import { html } from 'rehtm'

import { broadcast } from '../../../client/util/broadcast.js'
import { register } from '../registry.js'
import { currentTerm } from '../context.js'
import { TermError } from '../error.js'

import '../components/textual.js'

const env = async (...args) => {
  const term = currentTerm()
  let key, value, secret
  if (args[0] === '-s' || args[0] === '--secret') {
    const [_, k, ...v] = args
    secret = true
    key = k?.toUpperCase()
    value = v.join(' ')
  } else {
    const [k, ...v] = args
    key = k?.toUpperCase()
    value = v?.join(' ')
  }

  const safe = (key, val) => {
    if (term.secrets?.includes(key)) {
      return '*****'
    } else {
      return val
    }
  }

  if (key && value) {
    if (value.trim() === '') {
      delete term.env[key]
    } else {
      term.env[key] = value
    }
    term.log(html`<span><t-succ>SET</t-succ> ${key} = ${value ?? ''}</span>`)
    broadcast('env:set', { key, value: term.env[key] })
  } else if (key && secret) {
    const value = await term.read('enter secret value', true)
    term.env[key] = value
    ;(term.secrets ??= []).push(key)
    term.log(html`<span><t-succ>SET</t-succ> ${key} = *****</span>`)
    broadcast('env:set', { key, value: term.env[key] })
  } else if (key) {
    const value = term.env[key]
    term.log(safe(key, value ?? ''))
    return value
  } else if (secret) {
    throw new TermError('specify the name of the variable.')
  } else {
    const entries = Object.entries(term.env)
    if (entries.length > 0) {
      entries.forEach(([key, value]) => {
        term.log(html`<span><t-hl>${key}</t-hl> = ${safe(key, value ?? '')}</span>`)
      })
    } else {
      term.log('no env variables set.')
    }
  }
}

env.desc = 'get or set environment variables'
env.man = (term) => {
  term.log('usage:')
  term.log(html`<k-v><span slot="key">env</span>prints all env vars</k-v>`)
  term.log(html`<k-v><span slot="key">env ${'<key>'}</span>prints specific env var</k-v>`)
  term.log(html`<k-v><span slot="key">env ${'<key> <value>'}</span>sets env var to value</k-v>`)
  term.log(html`<k-v><span slot="key">env -s ${'<key>'}</span>sets secret env var</k-v>`)
}

register('env', env)

export const expand = (input) => input.replace(/\$\{?([A-Z0-9_]+)\}?/gi, (_, key) => currentTerm().env[key] ?? '')
