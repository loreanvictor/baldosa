const serializers = {}

export const serializeWith = (tagName, serializer) => {
  serializers[tagName.toUpperCase()] = serializer
}

export const serialize = (node) => {
  if (serializers[node.tagName]) {
    return serializers[node.tagName](node, serialize)
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  return [...node.childNodes].map(serialize).join('')
}
