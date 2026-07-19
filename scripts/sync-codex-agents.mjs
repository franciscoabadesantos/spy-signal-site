import { cp, mkdir, readFile, readdir, rename, rm, stat } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const managedPaths = ['config.toml', 'agents', 'skills']

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function filesUnder(root, relative = '') {
  const path = resolve(root, relative)
  const info = await stat(path)
  if (info.isFile()) return [relative]

  const files = []
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = relative ? `${relative}/${entry.name}` : entry.name
    if (entry.isDirectory()) files.push(...await filesUnder(root, child))
    else if (entry.isFile()) files.push(child)
  }
  return files
}

export async function collectDrift(sourceRoot, targetRoot) {
  const drift = []
  for (const relative of managedPaths) {
    const sourceFiles = new Set(await filesUnder(sourceRoot, relative))
    const targetPath = resolve(targetRoot, relative)
    if (!await exists(targetPath)) {
      drift.push(`missing ${relative}`)
      continue
    }

    const targetFiles = new Set(await filesUnder(targetRoot, relative))
    for (const file of sourceFiles) {
      if (!targetFiles.has(file)) {
        drift.push(`missing ${file}`)
        continue
      }
      const [source, target] = await Promise.all([readFile(resolve(sourceRoot, file)), readFile(resolve(targetRoot, file))])
      if (!source.equals(target)) drift.push(`modified ${file}`)
    }
    for (const file of targetFiles) {
      if (!sourceFiles.has(file)) drift.push(`unexpected ${file}`)
    }
  }
  return drift
}

async function replaceManagedPath(sourceRoot, targetRoot, relative) {
  const source = resolve(sourceRoot, relative)
  const target = resolve(targetRoot, relative)
  const temporary = resolve(targetRoot, `.${basename(relative)}.sync-${process.pid}`)
  const backup = resolve(targetRoot, `.${basename(relative)}.backup-${process.pid}`)

  await rm(temporary, { recursive: true, force: true })
  await rm(backup, { recursive: true, force: true })
  await cp(source, temporary, { recursive: true, force: true })

  if (await exists(target)) await rename(target, backup)
  try {
    await rename(temporary, target)
  } catch (error) {
    if (await exists(backup)) await rename(backup, target)
    throw error
  }
  await rm(backup, { recursive: true, force: true })
}

async function validateRoots(sourceRoot, targetRoot) {
  for (const relative of managedPaths) {
    if (!await exists(resolve(sourceRoot, relative))) {
      throw new Error(`Missing managed source path: ${sourceRoot}/${relative}`)
    }
  }
  if (await exists(targetRoot) && !(await stat(targetRoot)).isDirectory()) {
    throw new Error(`${targetRoot} exists but is not a directory; preserve it and resolve the conflict manually.`)
  }
}

export async function syncProjectLayer(sourceRoot, targetRoot) {
  await validateRoots(sourceRoot, targetRoot)
  await mkdir(targetRoot, { recursive: true })
  for (const relative of managedPaths) await replaceManagedPath(sourceRoot, targetRoot, relative)
}

async function main(args = process.argv.slice(2)) {
  const mode = args[0]
  const optionValue = (name) => {
    const index = args.indexOf(name)
    return index === -1 ? null : args[index + 1] ?? null
  }
  if (!['--apply', '--check'].includes(mode)) {
    throw new Error('Usage: node scripts/sync-codex-agents.mjs --apply|--check [--source path] [--target path]')
  }

  const projectRoot = process.cwd()
  const sourceRoot = resolve(projectRoot, optionValue('--source') ?? 'docs/agents/codex')
  const targetRoot = resolve(projectRoot, optionValue('--target') ?? '.codex')
  await validateRoots(sourceRoot, targetRoot)

  if (mode === '--apply') {
    await syncProjectLayer(sourceRoot, targetRoot)
    console.log(`Synced managed Codex config, agents, and skills into ${targetRoot}/.`)
    console.log('Managed paths are exact mirrors; files outside them were preserved.')
    return
  }

  const drift = await collectDrift(sourceRoot, targetRoot)
  if (drift.length) {
    console.error('Codex project layer is out of sync:')
    for (const item of drift) console.error(`- ${item}`)
    console.error('Run npm run agents:sync, then start a new Codex session.')
    process.exitCode = 1
    return
  }
  console.log('Codex project layer is in sync.')
}

const entrypoint = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href
if (import.meta.url === entrypoint) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
