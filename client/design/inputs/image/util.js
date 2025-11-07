/**
 * 
 * Get the local position of an event relative to a given element.
 * 
 * @param {*} event 
 * @param {*} element 
 * @returns {Object} an object containing the local position and the bounding rectangle of the element
 */
export const localpos = (event, element) => {
  const rect = element.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  return { pos: { x, y }, rect }
}

/**
 * 
 * Clamp a value to a given range.
 * 
 * @param {*} value 
 * @param {*} min 
 * @param {*} max 
 * @returns {number} the clamped value
 */
export const clamp = (value, min, max) => {
  if (value < min) return min
  if (value > max) return max
  return value
}

/**
 * Constrain the offset of the image to ensure it stays within the bounds of the container.
 * This is useful for preventing the image from being dragged outside of the visible area.
 * 
 * @param {Object} offset - The current offset of the image.
 * @param {number} imgw - The width of the image.
 * @param {number} imgh - The height of the image.
 * @param {number} scale - The current scale of the image.
 * @param {number} size - The size of the container.
 */
export const constrainOffset = (offset, imgw, imgh, scale, size) => {
  const w = imgw * scale
  const h = imgh * scale
  offset.x = clamp(offset.x, size - w, 0)
  offset.y = clamp(offset.y, size - h, 0)
}


/**
 * 
 * @param {*} event 
 * @returns {number} the distance between the two touch points
 */
export const touchdist = (event) => {
  const dx = event.touches[0].clientX - event.touches[1].clientX
  const dy = event.touches[0].clientY - event.touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}
