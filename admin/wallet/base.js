import { currentTerm } from '../term/index.js'

export const baseUrl = (term) => `${(term ?? currentTerm()).env['BANK_URL']}/wallet/admin`
