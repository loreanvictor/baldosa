import { buildHooksContext } from 'haken'

const { acceptHooks, hooksMeta } = buildHooksContext()
export const currentTerm = () => hooksMeta().term
export const withTerm = (term, fn) => {
  const [res] = acceptHooks(fn, { term })

  return res
}
