export const replaceWithGhost = (node) => {
  const ghost = node.cloneNode(true)
  ghost.style.filter = 'grayscale(1)'
  ghost.style.webkitFilter = 'grayscale(1)'
  ghost.style.opacity = 0.5
  ghost.__live__ = node
  node.replaceWith(ghost)
}

export const replaceWithLive = (ghost) => {
  if (ghost.__live__) {
    const node = ghost.__live__
    const marker = document.createTextNode('')
    ghost.replaceWith(marker)
    node.replaceWith(ghost)
    marker.replaceWith(node)
  }
}
