import { html } from 'rehtm'
import { parse } from 'envfile'

import { listenToBroadcast } from '../client/util/broadcast.js'
import { init as authInit, account } from './auth/index.js'
import { register, currentTerm, TermError } from './term/index.js'

import './term/textual.js'
import './tiles/index.js'
import './users/index.js'
import './wallet/index.js'
import './util/health-check.js'
import './util/exit.js'

const loadenv = async () => {
  console.log('HELLOW')
  const res = await fetch('/.env')
  if (!res.ok) {
    return {}
  }

  const text = await res.text()
  const env = parse(text)

  const s3base = env['S3_PUBLISH_URL_BASE']
  const s3bucket = env['S3_PUBLISH_BUCKET']
  const s3bucketBase = s3bucket && (env['S3_PUBLISH_BUCKET_URL'] = `https://${s3bucket}.s3.amazonaws.com`)

  ;(s3base ?? s3bucketBase) && (env['BASE_URL'] = s3base ?? s3bucketBase)

  return env
}

const DEFAULT_ENV = {
  BANK_URL: 'https://bank.baldosa.city',
  BASE_URL: 'https://dp5ho7dvg88z2.cloudfront.net',
}

const init = async () => {
  const term = currentTerm()

  term.log('authenticating ...')
  authInit()
  const acc = account()
  if (acc) {
    await term.run(`env USER ${acc.name}`, { silent: true })
    await term.run(`env USER_EMAIL ${acc.email}`, { silent: true })
    term.name(acc.name)
    term.log(html`<span>logged in as <t-hl>${acc.name}</t-hl></span>`)
  } else {
    throw new TermError('could not authenticate.', 'login with an admin account on baldosa.')
  }

  term.log('loading env ...')
  const env = {
    ...DEFAULT_ENV,
    ...(await loadenv()),
  }

  Object.entries(env).forEach(([key, value]) => {
    term.run(`env ${key} ${value}`, { silent: true })
  })

  if (!term.env['ADMIN_KEY']) {
    term.newline()
    term.log(html`<t-warn>IMPORTANT!</t-warn>`)
    term.log(html`<span>👉 set admin key using <t-cp actionable term=${term}>env -s admin_key</t-cp>.</span>`)
  }
}

init.desc = 'initializes the terminal.'
register('init', init)

const terminal = document.querySelector('admin-terminal')
terminal.controls.run('init', { silent: true }).then(() => {
  terminal.controls.run('tip', { silent: true })
})

listenToBroadcast('env:set', ({ key, value }) => {
  if (key === 'BANK_URL') {
    document.querySelector('health-check[name="bank"]').setAttribute('url', `${value}/health`)
  }
  if (key === 'PUBLISHER_URL') {
    document.querySelector('health-check[name="publisher"]').setAttribute('url', `${value}/health`)
  }
})
