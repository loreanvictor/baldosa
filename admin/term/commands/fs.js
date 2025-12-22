import yargs from 'yargs'
import { html } from 'rehtm'

import { join, absolute, slashjoin } from '../util/path.js'
import { register, registerCompleter } from '../registry.js'
import { currentTerm } from '../context.js'
import { TermError } from '../error.js'

import '../components/textual.js'

const pwd = () => {
  const term = currentTerm()
  term.log(term.cwd)

  return term.cwd
}
pwd.desc = 'prints current working directory.'
register('pwd', pwd)

const cd = async (path) => {
  const term = currentTerm()
  const fs = await term.fs()
  const target = join(term.cwd, path, term.home)
  const file = await fs.exists(target)
  if (!file) {
    throw new TermError(`Can't find directory ${target}`)
  } else if (file.type === 'file') {
    throw new TermError(`Not a directory: ${target}`)
  } else {
    term.cwd = target
  }
}
cd.desc = 'change working directory.'
register('cd', cd)

const ls = async (path) => {
  const term = currentTerm()
  const fs = await term.fs()
  try {
    const list = await fs.ls(absolute(join(term.cwd, path ?? '.', term.home)))
    list
      .filter((e) => e.type === 'dir')
      .forEach((dir) =>
        term.log(
          html`<t-cols layout="1fr 1fr">
            <t-cp actionable><t-hl>${dir.name}</t-hl></t-cp>
            <span>${new Date(dir.created).toLocaleString()}</span>
          </t-cols>`,
        ),
      )
    list
      .filter((e) => e.type === 'file')
      .forEach((file) =>
        term.log(
          html`<t-cols layout="1fr 1fr">
            <t-cp actionable>${file.name}</t-cp>
            <span>${new Date(file.modified).toLocaleString()}</span>
          </t-cols>`,
        ),
      )

    return list
  } catch (err) {
    throw new TermError(err.message)
  }
}
ls.desc = 'list files in (current) directory.'
register('ls', ls)

const mkdir = async (path) => {
  const term = currentTerm()
  const fs = await term.fs()
  try {
    await fs.mkdir(absolute(join(term.cwd, path, term.home)))
  } catch (err) {
    throw new TermError(err.message)
  }
}
mkdir.desc = 'creates a directory.'
register('mkdir', mkdir)

const rm = async (...args) => {
  const term = currentTerm()
  const fs = await term.fs()
  const { _, r, recursive } = yargs(args).parse()
  const _r = recursive ?? r
  const path = _[0] ?? _r

  try {
    await fs.rm(absolute(join(term.cwd, path, term.home)), { recursive: !!_r })
  } catch (err) {
    console.error(err)
    throw new TermError(err.message)
  }
}
rm.desc = 'removes a file.'
register('rm', rm)

const cp = async (...args) => {
  const term = currentTerm()
  const fs = await term.fs()
  const { _, r, recursive } = yargs(args).parse()
  const _r = recursive ?? r
  const [src, dest] = _.length === 1 && _r ? [_r, _[0]] : _

  try {
    await fs.cp(absolute(join(term.cwd, src, term.home)), absolute(join(term.cwd, dest, term.home)), {
      recursive: !!_r,
    })
  } catch (err) {
    console.error(err)
    throw new TermError(err.message)
  }
}
cp.desc = 'copies a file.'
register('cp', cp)

const mv = async (src, dest) => {
  const term = currentTerm()
  const fs = await term.fs()
  try {
    await fs.mv(absolute(join(term.cwd, src, term.home)), absolute(join(term.cwd, dest, term.home)))
  } catch (err) {
    console.error(err)
    throw new TermError(err.message)
  }
}
mv.desc = 'moves a file.'
register('mv', mv)

export const search = (cond) => async (args) => {
  const argparts = args.split(' ')
  const arg = argparts.at(-1)
  const rest = argparts.slice(0, -1)
  const term = currentTerm()
  const fs = await term.fs()
  const trimmed = arg.trim()
  const parts = trimmed.split('/')
  const name = parts.at(-1)
  const ogpath = trimmed.startsWith('/') ? '/' + parts.slice(0, -1).join('/') : parts.slice(0, -1).join('/')
  const path = absolute(join(term.cwd, ogpath, term.home))

  return (await fs.ls(path))
    .filter((f) => f.name.startsWith(name) && (!cond || cond(f)))
    .map((f) => [...rest, slashjoin(ogpath, f.name) + (f.type === 'dir' ? '/' : '')].join(' '))
}

export const dirsearch = search((f) => f.type === 'dir')
export const filesearch = search()

registerCompleter('ls', dirsearch)
registerCompleter('cd', dirsearch)
registerCompleter('mkdir', dirsearch)
registerCompleter('rm', filesearch)
registerCompleter('cp', filesearch)
registerCompleter('mv', filesearch)

// --- utilities for other commands ---
export const resolve = async (path, term) => {
  const fs = await term.fs()
  return fs.exists(absolute(join(term.cwd, path, term.home)))
}

export const write = async (path, content, author, term) => {
  const fs = await term.fs()
  return fs.write(absolute(join(term.cwd, path, term.home)), content, author)
}
