import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { collectDrift } from '../scripts/sync-codex-agents.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const script = resolve(projectRoot, 'scripts/sync-codex-agents.mjs')

async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'spy-codex-sync-'))
  const source = resolve(root, 'source')
  const target = resolve(root, 'target')
  await mkdir(resolve(source, 'agents'), { recursive: true })
  await mkdir(resolve(source, 'skills/frontend-delivery'), { recursive: true })
  await writeFile(resolve(source, 'config.toml'), 'model = "test"\n')
  await writeFile(resolve(source, 'agents/reviewer.toml'), 'name = "reviewer"\n')
  await writeFile(resolve(source, 'skills/frontend-delivery/SKILL.md'), '---\nname: frontend-delivery\ndescription: Test skill\n---\n')
  return { root, source, target }
}

function run(mode, source, target) {
  const { NODE_OPTIONS, NODE_TEST_CONTEXT, ...environment } = process.env
  return spawnSync(process.execPath, [script, mode, '--source', source, '--target', target], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: environment,
  })
}

test('agents check passes for an identical managed tree', async (t) => {
  const { root, source, target } = await fixture()
  t.after(() => rm(root, { recursive: true, force: true }))
  assert.equal(run('--apply', source, target).status, 0)
  assert.equal(run('--check', source, target).status, 0)
})

for (const [name, mutate, expected] of [
  ['missing managed file', async (target) => rm(resolve(target, 'agents/reviewer.toml')), 'missing agents/reviewer.toml'],
  ['modified managed file', async (target) => writeFile(resolve(target, 'config.toml'), 'model = "changed"\n'), 'modified config.toml'],
  ['unexpected managed file', async (target) => writeFile(resolve(target, 'agents/old-agent.toml'), 'name = "old"\n'), 'unexpected agents/old-agent.toml'],
]) {
  test(`agents check fails for ${name}`, async (t) => {
    const { root, source, target } = await fixture()
    t.after(() => rm(root, { recursive: true, force: true }))
    assert.equal(run('--apply', source, target).status, 0)
    await mutate(target)
    const result = run('--check', source, target)
    assert.equal(result.status, 1)
    assert.deepEqual(await collectDrift(source, target), [expected])
  })
}

test('agents sync removes obsolete managed files and preserves unmanaged files', async (t) => {
  const { root, source, target } = await fixture()
  t.after(() => rm(root, { recursive: true, force: true }))
  assert.equal(run('--apply', source, target).status, 0)
  await writeFile(resolve(target, 'agents/old-agent.toml'), 'name = "old"\n')
  await writeFile(resolve(target, 'skills/old-skill.md'), 'obsolete\n')
  await writeFile(resolve(target, 'local-note.txt'), 'preserve me\n')

  assert.equal(run('--apply', source, target).status, 0)
  assert.equal(run('--check', source, target).status, 0)
  await assert.rejects(readFile(resolve(target, 'agents/old-agent.toml')))
  await assert.rejects(readFile(resolve(target, 'skills/old-skill.md')))
  assert.equal(await readFile(resolve(target, 'local-note.txt'), 'utf8'), 'preserve me\n')
})
