import { broadcast } from '../../util/broadcast.js'
import * as backend from './backend.js'

// TODO: probably needs error handling?

const format = tx => ({
  ...tx,
  meta: {
    time: new Date(tx.created_at),
    total: tx.consumed_value + tx.merged_value,
    type: tx.is_state ? (
      tx.consumes && tx.merges ? 'merged-state' : tx.consumes ? 'forked-state' : 'init-state'
    ) : (
      tx.receiver === _balance.receiver && !!_balance ? 'incoming' : 'outgoing'
    )
  }
})

const deformat = tx => {
  const { meta, ...rest } = tx
  return rest
}

let _balance

export const balance = async () => {
  const tx = await backend.balance()
  _balance = tx

  return format(tx)
}


export const history = async () => {
  return (await backend.history()).map(format)
}

export const offers = async () => {
  if (!_balance) {
    await balance()
  }

  const offs = await backend.offers()
  return offs.filter(s => !s.is_state).map(format)
}

export const accept = async offer => {
  const balance = await backend.accept(deformat(offer))
  _balance = balance
  const fmt = format(balance)
  broadcast('wallet:balance_changed', fmt)

  return fmt
}
