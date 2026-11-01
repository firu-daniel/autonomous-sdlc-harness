/**
 * `corpusFiles` over symlinked fixtures.
 *
 * **The rule this test exists to enforce: a corpus candidate is admitted only when it lies inside the
 * repository both as spelled and after symlink resolution.** A link escaping the repository is
 * skipped with a warning, one resolving inside is kept under its own path, and walk warnings come in
 * code-unit order. Each case builds its own tree under the system temp directory.
 */

import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { corpusFiles } from '../dist/retrieval/corpus.js';

/** A temp base holding `repo/` and `outside/outside.md`, removed when the test ends. */
async function layout(t) {
  const base = await mkdtemp(join(tmpdir(), 'harness-corpus-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const repo = join(base, 'repo');
  const outside = join(base, 'outside');
  await mkdir(join(repo, 'docs'), { recursive: true });
  await mkdir(outside, { recursive: true });
  await writeFile(join(outside, 'outside.md'), '# Outside\n');
  return { base, repo, outside };
}

const docsOnly = { docs: { root: 'docs' }, layers: [] };

test('(a) a docs file linked outside the repository is skipped with a warning', async (t) => {
  const { repo, outside } = await layout(t);
  await writeFile(join(repo, 'docs', 'own.md'), '# Own\n');
  await symlink(join(outside, 'outside.md'), join(repo, 'docs', 'linked.md'));

  assert.deepEqual(corpusFiles(repo, docsOnly), {
    files: ['docs/own.md'],
    warnings: ['docs.root file docs/linked.md resolves outside the repository and was skipped'],
  });
});

test('(b) a docs file linked inside the repository is kept under its own path', async (t) => {
  const { repo } = await layout(t);
  await mkdir(join(repo, 'shared'));
  await writeFile(join(repo, 'shared', 'target.md'), '# Target\n');
  await symlink(join(repo, 'shared', 'target.md'), join(repo, 'docs', 'linked.md'));

  assert.deepEqual(corpusFiles(repo, docsOnly), { files: ['docs/linked.md'], warnings: [] });
});

test('(c) a conventions document linked outside is skipped, one linked inside is kept', async (t) => {
  const { repo, outside } = await layout(t);
  await mkdir(join(repo, 'conv'));
  await mkdir(join(repo, 'shared'));
  await writeFile(join(repo, 'shared', 'rules.md'), '# Rules\n');
  await symlink(join(outside, 'outside.md'), join(repo, 'conv', 'out.md'));
  await symlink(join(repo, 'shared', 'rules.md'), join(repo, 'conv', 'in.md'));
  const config = {
    docs: { root: 'docs' },
    layers: [
      { name: 'escape', path: 'a', conventions: 'conv/out.md' },
      { name: 'kept', path: '.', conventions: 'conv/in.md' },
    ],
  };

  assert.deepEqual(corpusFiles(repo, config), {
    files: ['conv/in.md'],
    warnings: ['conventions document conv/out.md of layer escape resolves outside the repository and was skipped'],
  });
});

test('(d) a docs.root that is itself a link to an outside directory contributes nothing', async (t) => {
  const { repo, outside } = await layout(t);
  await rm(join(repo, 'docs'), { recursive: true });
  await symlink(outside, join(repo, 'docs'));

  assert.deepEqual(corpusFiles(repo, docsOnly), {
    files: [],
    warnings: ['docs.root docs resolves outside the repository and was skipped'],
  });
});

test('(e) a repository root reached through an alias link still keeps an inside link', async (t) => {
  const { base, repo } = await layout(t);
  await mkdir(join(repo, 'shared'));
  await writeFile(join(repo, 'shared', 'target.md'), '# Target\n');
  await symlink(join(repo, 'shared', 'target.md'), join(repo, 'docs', 'linked.md'));
  const alias = join(base, 'alias');
  await symlink(repo, alias);

  assert.deepEqual(corpusFiles(alias, docsOnly), { files: ['docs/linked.md'], warnings: [] });
});

test('(f) escape warnings come in code-unit order, and a dangling link yields nothing', async (t) => {
  const { repo, outside } = await layout(t);
  await symlink(join(outside, 'outside.md'), join(repo, 'docs', 'z.md'));
  await symlink(join(outside, 'outside.md'), join(repo, 'docs', 'B.md'));
  await symlink(join(repo, 'docs', 'absent-target.md'), join(repo, 'docs', 'dangling.md'));

  assert.deepEqual(corpusFiles(repo, docsOnly), {
    files: [],
    warnings: [
      'docs.root file docs/B.md resolves outside the repository and was skipped',
      'docs.root file docs/z.md resolves outside the repository and was skipped',
    ],
  });
});
