/**
 * The `treeGuards` key's structural check, through `config set` / `get`, against the compiled CLI.
 *
 * **The rule this suite exists to enforce: `treeGuards` is an array whose every entry carries
 * exactly a non-empty `test` and `covers`, and a `set` that breaks that writes nothing.** A refusal
 * is asserted on the bytes on disk (`.claude/context/cli.md` → *"A refusal is asserted on the bytes
 * on disk"*): the whole tree is snapshotted before and compared after, which also proves no `.bak`
 * was written for a write that never happened.
 *
 * Whether a `test` names a real file is `doctor`'s question, not the shape check's, so no case here
 * plants or omits the file a guard names.
 */

import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, readJson, runCli, snapshotTree } from './helpers/fixture.mjs';

const CONFIG_FILE = 'harness.config.json';

/** A repository whose stack detection resolves every command, so `init` writes a config the check passes. */
function nodeProjectFiles() {
  return {
    'package.json': {
      name: 'fixture-project',
      private: true,
      version: '0.0.0',
      scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
    },
    'README.md': '# fixture project\n',
  };
}

async function wiredFixture(t) {
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);
  const result = await runCli(fixture.dir, ['init']);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return fixture.dir;
}

const GUARDS = [
  { test: 'test/main-anchor-isolation.test.mjs', covers: 'cli/templates/scripts/**' },
  { test: 'test/config-tree-guards.test.mjs', covers: 'cli/src/config/*.ts' },
];

test('set accepts a well-formed treeGuards list and get reads it back', async (t) => {
  const dir = await wiredFixture(t);

  const set = await runCli(dir, ['config', 'set', 'treeGuards', JSON.stringify(GUARDS)]);
  assert.equal(set.status, 0, `set exited ${set.status}\n${set.stdout}\n${set.stderr}`);

  assert.deepEqual(readJson(join(dir, CONFIG_FILE)).treeGuards, GUARDS);
  const get = await runCli(dir, ['config', 'get', 'treeGuards']);
  assert.equal(get.status, 0, `get exited ${get.status}\n${get.stdout}\n${get.stderr}`);
  assert.deepEqual(JSON.parse(get.stdout), GUARDS);
});

test('set refuses a malformed treeGuards value and writes nothing', async (t) => {
  const dir = await wiredFixture(t);

  const refused = [
    ['a non-array', { test: 'test/a.test.mjs', covers: 'cli/**' }, 'treeGuards: must be an array of objects'],
    ['an entry missing covers', [{ test: 'test/a.test.mjs' }], 'treeGuards[0].covers: is required'],
    ['an entry with an extra key', [{ ...GUARDS[0], layer: 'cli' }], 'treeGuards[0].layer: unknown key'],
    ['an empty test', [{ ...GUARDS[0], test: '' }], 'treeGuards[0].test: must not be empty'],
  ];
  for (const [name, value, expected] of refused) {
    await t.test(`${name} is refused`, async () => {
      const before = await snapshotTree(dir);
      const { status, stdout, stderr } = await runCli(dir, ['config', 'set', 'treeGuards', JSON.stringify(value)]);
      assert.equal(status, 1, `set exited ${status}\n${stdout}\n${stderr}`);
      assert.ok(stderr.includes(expected), `stderr does not carry ${JSON.stringify(expected)}\n${stderr}`);
      assert.deepEqual(await snapshotTree(dir), before, 'a refused set changed the tree');
    });
  }
});
