import { openDB } from 'idb'

const ROOT = 'root'

const connect = async (dbname) => {
  return await openDB(dbname, 1, {
    upgrade(db) {
      const store = db.createObjectStore('files', { keyPath: 'id' })
      store.createIndex('by_parent', 'parent')
      store.createIndex('by_parent_and_name', ['parent', 'name'])

      store.add({
        id: ROOT,
        parent: null,
        name: '',
        type: 'dir',
        created: Date.now(),
        modified: Date.now(),
      })
    },
  })
}

const split = (p) => p.split('/').filter(Boolean)
const resolve = async (path, tx) => {
  const parts = split(path)
  let cur = await tx.store.get(ROOT)

  for (const name of parts) {
    const next = await tx.store.index('by_parent_and_name').get([cur.id, name])
    if (!next) throw new Error(`File not found: ${path}`)
    cur = next
  }

  return cur
}

export const makeFs = async (name, encryption) => {
  const db = await connect(name)

  const ls = async (path) => {
    const tx = db.transaction('files', 'readonly')
    const dir = await resolve(path, tx)
    if (dir.type !== 'dir') throw new Error(`Not a directory: ${path}`)

    const list = await tx.store.index('by_parent').getAll(dir.id)
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }

  const mkdir = async (path) => {
    const parts = split(path)
    const tx = db.transaction('files', 'readwrite')
    let cur = await tx.store.get(ROOT)

    for (const name of parts) {
      let next = await tx.store.index('by_parent_and_name').get([cur.id, name])

      if (!next) {
        next = {
          id: crypto.randomUUID(),
          parent: cur.id,
          name,
          type: 'dir',
          created: Date.now(),
          modified: Date.now(),
        }
        await tx.store.add(next)
      }

      if (next.type !== 'dir') throw new Error(`Not a directory: ${next.name} in ${path}`)
      cur = next
    }

    await tx.done
  }

  const watchers = new Map()

  const write = async (path, content, author) => {
    const parts = split(path)
    const name = parts.pop()
    const tx = db.transaction('files', 'readonly')
    const parent = await resolve('/' + parts.join('/'), tx)
    if (parent.type !== 'dir') throw new Error(`Not a directory ${parent.name} in ${path}`)

    let file = await tx.store.index('by_parent_and_name').get([parent.id, name])
    if (!file) {
      file = {
        id: crypto.randomUUID(),
        parent: parent.id,
        name,
        type: 'file',
        created: Date.now(),
      }
    }

    return writefile(file, content, author)
  }

  const writefile = async (file, content, author) => {
    const nonce = await encryption.nonce()
    const cypher = await encryption.encrypt(content, nonce)
    const tx = db.transaction('files', 'readwrite')

    file.content = { nonce, cypher }
    file.modified = Date.now()

    await tx.store.put(file)
    await tx.done

    watchers.get(file.id)?.forEach((watcher) => watcher.onWrite && watcher.onWrite({ file, content, author }))

    return file
  }

  const watch = (file, watcher) => {
    if (!watchers.has(file.id)) {
      watchers.set(file.id, new Set())
    }
    watchers.get(file.id).add(watcher)
    return () => {
      watchers.get(file.id).delete(watcher)
      if (watchers.get(file.id).size === 0) {
        watchers.delete(file.id)
      }
    }
  }

  const readfile = async (file) => {
    const { nonce, cypher } = file.content
    return encryption.decrypt(cypher, nonce)
  }

  const read = async (path) => {
    const tx = db.transaction('files', 'readonly')
    const file = await resolve(path, tx)

    if (file.type !== 'file' || !file.content) throw new Error(`Not a file: ${path}`)
    return readfile(file)
  }

  const rm = async (path, opts, author) => {
    const tx = db.transaction('files', 'readwrite')
    const file = await resolve(path, tx)

    if (file.id === ROOT) throw new Error('Cannot delete /')
    if (file.type === 'dir' && !opts?.recursive) throw new Error(`Can't delete directory ${path}`)

    const collect = async (id, acc) => {
      const kids = await tx.store.index('by_parent').getAll(id)
      for (const k of kids) {
        if (k.type === 'dir') await collect(k.id, acc)
        acc.push(k.id)
      }
    }

    const ids = []
    await collect(file.id, ids)
    ids.push(file.id)

    for (const id of ids.reverse()) await tx.store.delete(id)
    await tx.done

    watchers.get(file.id)?.forEach((watcher) => watcher.onRemove && watcher.onRemove({ file, author }))
    watchers.delete(file.id)
  }

  const mv = async (src, dest) => {
    const tx = db.transaction('files', 'readwrite')
    const file = await resolve(src, tx)

    const parts = split(dest)
    const name = parts.pop()
    const ppath = '/' + parts.join('/')
    const parent = await resolve(ppath, tx)

    if (parent.type !== 'dir') throw new Error(`Not a directory: ${ppath}`)

    const exists = await tx.store.index('by_parent_and_name').get([parent.id, name])
    if (exists) throw new Error(`Already exists: ${dest}`)

    if (file.type === 'dir') {
      let p = parent
      while (p) {
        if (p.id === file.id) throw new Error(`Can't move ${src} to ${dest}`)
        p = p.parent ? await tx.store.get(p.parent) : null
      }
    }

    file.parent = parent.id
    file.name = name
    file.modified = Date.now()

    await tx.store.put(file)
    await tx.done
  }

  const cp = async (src, dest, opts) => {
    const tx = db.transaction('files', 'readwrite')
    const node = await resolve(src, tx)

    const parts = split(dest)
    const name = parts.pop()
    const ppath = '/' + parts.join('/')
    const parent = await resolve(ppath, tx)

    if (parent.type !== 'dir') throw new Error(`Not a directory: ${ppath}`)

    const exists = await tx.store.index('by_parent_and_name').get([parent.id, name])
    if (exists) throw new Error(`Already exists: ${dest}`)

    if (node.type === 'dir' && !opts?.recursive) throw new Error(`Can't copy directory ${src} without recursive`)

    const clone = async (src, dstp, dstn) => {
      const copy = {
        ...src,
        id: crypto.randomUUID(),
        parent: dstp,
        name: dstn,
        created: Date.now(),
        modified: Date.now(),
      }

      if (copy.type === 'file') {
        copy.content = src.content
        await tx.store.add(copy)
        return
      }

      delete copy.content
      await tx.store.add(copy)

      const kids = await tx.store.index('by_parent').getAll(src.id)
      for (const k of kids) {
        await clone(k, copy.id, k.name)
      }
    }

    await clone(node, parent.id, name)
    await tx.done
  }

  const exists = async (path) => {
    const parts = split(path)
    const tx = db.transaction('files', 'readonly')
    let cur = await tx.store.get(ROOT)

    for (const name of parts) {
      cur = await tx.store.index('by_parent_and_name').get([cur.id, name])
      if (!cur) return false
    }

    return cur
  }

  return { ls, exists, mkdir, read, readfile, write, writefile, cp, mv, rm, watch }
}
