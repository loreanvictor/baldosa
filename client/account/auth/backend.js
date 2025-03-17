// TODO: connect these to the actual server

export const startLogin = async () => 'ladida'

export const finishLogin = async (credentials) => {
  const creds = JSON.parse(localStorage.getItem('credentials') ?? '[]')
  const matching = creds.find(c => c.id === credentials.id)
  if (matching) {
    return ({ email: matching.email, name: matching.name, token: 'whatever' })
  } else {
    throw new Error('Invalid credentials')
  }
}

export const startRegister = async email => ({ challenge: 'ladida', userid: `id-${email}` })

export const finishRegister = async (email, name, credentials) => {
  const creds = JSON.parse(localStorage.getItem('credentials') ?? '[]')
  localStorage.setItem('credentials', JSON.stringify([...creds, { email, name, id: credentials.id }]))

  return { email, name, token: 'whatever' }
}
