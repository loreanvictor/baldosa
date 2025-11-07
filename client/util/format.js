export const trim = (msg, length) => msg.length > length ? msg.slice(0, length) + '…' : msg

export const midtrim = (msg, max, cutoff) =>
    msg.length > max ? 
  `${msg.slice(0, cutoff ?? max / 2)}...${msg.slice(-(cutoff ? (max - cutoff) : max / 2))}`
  : msg

export const eta = (time, short) => {
  const date = new Date(time)
  const now = new Date()
  const diff = date - now
  if (diff <= 60_000) return 'soonish'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return short ? `${hours}h ${minutes}m` : `in ${hours} hours${minutes > 0 ? ` and ${minutes} minutes` : ''}`
}

export const dateish = time => {
  const date = new Date(time)
  const now = new Date()

  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (now.getFullYear() !== date.getFullYear())
    return date.toLocaleString('en-GB', { year: 'numeric', month: 'short' })
  if (days > 10) return date.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''} ago`

  return 'just now'
}
