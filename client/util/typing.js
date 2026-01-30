const activeElement = () => {
  let el = document.activeElement
  while (el?.shadowRoot?.activeElement) {
    el = el.shadowRoot.activeElement
  }
  return el
}

export const isTyping = () => {
  const el = activeElement()

  if (!el) return false

  const tagName = el.tagName.toLowerCase()
  const editable = el.isContentEditable

  return tagName === 'input' || tagName === 'textarea' || editable
}
