import { buildHooksContext } from 'haken'

const { acceptHooks, hooksMeta } = buildHooksContext()
export const currentTerm = () => hooksMeta().term
export const currentPiped = () => hooksMeta().piped
export const withTerm = (term, fn, opts) => {
  const [res] = acceptHooks(fn, { term, piped: opts?.piped })

  return res
}
