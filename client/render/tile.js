import { fillSquareWithImage } from './image/util.js'


const SPACING = 0.025
const RADIUS = 0.05

export function drawTile(ctx, tile, bounds, camera, mouse, gallery, repo) {
  const viewHalfW = bounds.width / 2
  const viewHalfH = bounds.height / 2
  const zoomedOut = camera.zoom <= bounds.wmin / 4

  const actX = (tile.x + SPACING - camera.x) * camera.zoom + viewHalfW
  const actY = (tile.y + SPACING - camera.y) * camera.zoom + viewHalfH
  const size = camera.zoom * (1 - 2 * SPACING)
  const cx = actX + size / 2
  const cy = actY + size / 2

  const active = actX < mouse.x && mouse.x < actX + size &&
                  actY < mouse.y && mouse.y < actY + size
  const hover = mouse.supportsHover && active
  const hoverK = (1 - Math.min(
    Math.sqrt(
      (cx - mouse.x) * (cx - mouse.x) +
      (cy - mouse.y) * (cy - mouse.y)
    ) / ((zoomedOut ? 2 : 1) * size), 1
  ))

  const rx = actX
  const ry = mouse.supportsHover ? actY + hoverK * (zoomedOut ? 8 : 4) : actY

  ctx.save()
  ctx.fillStyle = '#212121'
  ctx.beginPath()
  ctx.roundRect(rx, ry, size, size, RADIUS * camera.zoom)
  ctx.closePath()
  ctx.clip()
  ctx.fill()

  ctx.font = `${camera.zoom / 18}px "Open Sans"`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#616161'
  ctx.fillText(`${tile.x},${tile.y}`,
    rx + size - (SPACING + RADIUS) * camera.zoom,
    ry + size - (SPACING + RADIUS) * camera.zoom,
  )

  const data = repo.get(tile.x, tile.y)
  if (data) {
    if (data.background) {
      ctx.fillStyle = data.background
      ctx.fillRect(rx, ry, size, size)
    }
    
    if (data.image) {
      ctx.fillStyle = '#424242'
      ctx.fillRect(rx, ry, size, size)
      const img = gallery.get(data.image, camera.zoom / Math.max(1, camera.v * 64))
      if (img) {
        const [dx, dy, dw, dh] = fillSquareWithImage(
          img, rx, ry, size
        )
        ctx.drawImage(img, dx, dy, dw, dh)
      }
      
      if (data.title || data.subtitle) {
        const gradient = ctx.createLinearGradient(0, ry, 0, ry + size)
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.65)')
        ctx.fillStyle = gradient
        ctx.fillRect(rx, ry, size, size)
      }
    }
    
    if (data.title) {
      ctx.fillStyle = data.color ?? `rgba(255, 255, 255, ${Math.min(1, .5 + .5 / Math.max(1, (camera.v * 64)))})`
      ctx.font = `bold ${camera.zoom / 14}px "Montserrat"`
      ctx.textAlign = 'left'
      ctx.fillText(
        data.title,
        rx + SPACING * 2 * camera.zoom,
        data.subtitle ? ry + size - (SPACING * 4 + 0.1) * camera.zoom : ry + size - SPACING * 2 * camera.zoom,
      )
    }
    
    if (data.subtitle) {
      ctx.fillStyle = data.color ?? `rgba(255, 255, 255, ${Math.min(1, .5 + .5 / Math.max(1, (camera.v * 64)))})`
      ctx.font = `${camera.zoom / 16}px "Open Sans"`
      ctx.textAlign = 'left'
      ctx.fillText(
        data.subtitle,
        rx + SPACING * 2 * camera.zoom,
        ry + size - SPACING * 4 * camera.zoom,
      )
    }
  }
  
  if (hover) {
    ctx.fillStyle = `rgba(255, 255, 255, ${hoverK * zoomedOut ? .5 : .25 })`
    ctx.globalCompositeOperation = 'overlay'
    ctx.rect(rx, ry, size, size)
    ctx.fill()
  }

  if (active) {
    mouse.onHover(tile)
  }
  
  ctx.restore()
}
