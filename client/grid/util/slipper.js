const addScalar = (a, b) => a + b
const diffScalar = (a, b) => a - b
const mulScalar = (a, b) => a * b
const lenScalar = v => Math.abs(v)

export const slipperyValue = (callback, options) => {
  let value = options?.initial
  const friction = options?.friction ?? 0.05
  const diff = options?.diff ?? diffScalar
  const add = options?.add ?? addScalar
  const mul = options?.mul ?? mulScalar
  const len = options?.len ?? lenScalar

  let vel
  let locked = false

  const obj = {
    locked: () => locked,
    unlock: () => (locked = false, slip()),
    set: v => (vel = diff(v, value), value = v, callback && callback(value, vel), obj),
    change: v => (vel = v, value = add(value, v), callback && callback(value, vel), obj),
    init: v => (vel = undefined, value = v, locked = true, obj),
    get: () => value,
    velocity: () => vel,
  }

  const slip = () => {
    if (!locked) {
      if (vel !== undefined && len(vel) > 0.01) {
        vel = mul(vel, 1 / (1 + friction))
        value = add(value, vel)
        callback && callback(value, vel)
        requestAnimationFrame(slip)
      } else if (vel === undefined) {
        vel = diff(value, value)
        callback && callback(value, vel)
      }
    }
  }

  return obj
}

export const slipperyVector = (callback, options) => {
  const opts = options ?? {}
  opts.add = (a, b) => ({ x: (a?.x ?? 0) + (b?.x ?? 0), y: (a?.y ?? 0) + (b?.y ?? 0) })
  opts.diff = (a, b) => ({ x: (a?.x ?? 0) - (b?.x ?? 0), y: (a?.y ?? 0) - (b?.y ?? 0) })
  opts.mul = (a, b) => ({ x: (a?.x ?? 0) * (b ?? 0), y: (a?.y ?? 0) * (b ?? 0) })
  opts.len = v => Math.sqrt((v?.x ?? 0) * (v?.x ?? 0) + (v?.y ?? 0) * (v?.y ?? 0))

  return slipperyValue(callback, opts)
}
