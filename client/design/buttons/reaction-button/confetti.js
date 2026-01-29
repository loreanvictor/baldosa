import confetti from 'https://esm.run/canvas-confetti@1.9.4'

const DEFAULT_COLORS = ['#ffffff', '#b5c99a', '#84d2c5', '#ffc95f', '#804674', '#f38181']

const CONFETTI_TYPES = {
  surround: {
    particleCount: 64,
    spread: 360,
    startVelocity: 2,
    scalar: 0.25,
    ticks: 35,
    gravity: 0,
    decay: 0.9,
    shapes: ['square'],
    flat: true,
  },
  pop: {
    particleCount: 16,
    spread: 120,
    startVelocity: 4,
    scalar: 0.35,
    ticks: 35,
    gravity: 0.25,
    decay: 0.9,
    shapes: ['square'],
    flat: true,
  },
  puff: {
    particleCount: 48,
    spread: 360,
    startVelocity: 1,
    scalar: 0.75,
    ticks: 35,
    gravity: 0,
    decay: 0.95,
    shapes: ['circle'],
    flat: true,
  },
}

export const prepConfetti = (canvas, conf) => {
  const fire = confetti.create(canvas, {
    resize: true,
    useWorker: true,
  })

  const confettiParams = parseConf(conf)

  return (target) => {
    const rect = canvas.getBoundingClientRect()
    const me = target.getBoundingClientRect()
    fire({
      ...confettiParams,
      origin: {
        x: (me.left + me.width / 2 - rect.left) / rect.width,
        y: (me.top + me.height / 2 - rect.top) / rect.height,
      },
    })
  }
}

const parseConf = (conf) => {
  const [type, colors] = (conf ?? '').split(':')
  const base = CONFETTI_TYPES[type] || CONFETTI_TYPES.pop
  const cols = colors ? colors.split(',') : DEFAULT_COLORS
  return { ...base, colors: cols }
}
