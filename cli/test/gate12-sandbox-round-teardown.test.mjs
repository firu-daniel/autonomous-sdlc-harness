/**
 * `scripts/gate12-sandbox-round.sh teardown`: round step 10's branch removal.
 *
 * **The rule this suite enforces: teardown never removes what the state file does not record, and
 * it confirms the GitHub default branch rather than changing it.** A recorded name it could not
 * delete stays recorded and exits 5 with its hand command; so does a default branch other than the
 * recorded one, with no `gh repo edit` issued.
 *
 * It reads one fixed script, not a tree, so it owes no `treeGuards` entry.
 */

import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import test from 'node:test';

import { readJson, runGit } from './helpers/fixture.mjs';
import { cleanup, GATE12_SLUG, ghStub, ghStubCalls, makeGate12Fixture, runRound } from './helpers/gate12-round.mjs';

const RECORDED = ['gate12_js1_settings_20260101000000', 'gate12_sb2_token_20260101000000'];
const OTHER = 'gate12_other_20260101000000';
// Named like a planted branch, but absent from the state: its name is no licence to delete it.
const UNRECORDED = 'gate12_js1_settings_19990101000000';

const RUNS = [{ row: 'JS1', arm: 'settings', branch: RECORDED[0], run_id: 4242, dispatched_at: '2026-01-01T00:00:00Z' }];
const TOKENS = { SB2: '0123456789abcdef0123456789abcdef' };

const ARGS = ['teardown', '--repo', GATE12_SLUG];

const git = async (dir, args) => (await runGit(dir, args)).stdout.trim();

const show = (result) => `status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`;

const lastLine = (stdout) => stdout.trimEnd().split('\n').at(-1);

const hasRef = async (dir, ref) => (await git(dir, ['for-each-ref', '--format=%(refname)', ref])) !== '';

/**
 * A fixture whose origin and checkout hold each recorded branch on a commit of its own, whose origin
 * also holds {@link UNRECORDED}, and whose state file records the recorded ones, `runs[]` and `tokens`.
 */
async function fixtureFor(t, { names = RECORDED, other = OTHER } = {}) {
  const fixture = await makeGate12Fixture();
  t.after(() => cleanup(fixture));
  const recorded = other === null ? names : [...names, other];
  const branches = [];
  for (const name of [...recorded, UNRECORDED]) {
    await runGit(fixture.dir, ['commit', '--quiet', '--allow-empty', '-m', name]);
    const commit = await git(fixture.dir, ['rev-parse', 'HEAD']);
    await runGit(fixture.dir, ['push', '--quiet', 'origin', `HEAD:refs/heads/${name}`]);
    if (name !== UNRECORDED) await runGit(fixture.dir, ['update-ref', `refs/heads/${name}`, commit]);
    if (names.includes(name)) branches.push({ name, row: 'JS1', arm: 'settings', commit });
    await runGit(fixture.dir, ['reset', '--quiet', '--hard', 'HEAD~1']);
  }
  const state = {
    schema: 1,
    repo: GATE12_SLUG,
    default_branch: 'main',
    branches,
    runs: RUNS,
    tokens: TOKENS,
    other_branch: other,
    variables: {},
  };
  await mkdir(dirname(fixture.stateFile), { recursive: true });
  await writeFile(fixture.stateFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return { fixture, recorded, unrecordedTip: await git(fixture.origin, ['rev-parse', `refs/heads/${UNRECORDED}`]) };
}

test('teardown deletes every recorded branch on origin and locally, and leaves the unrecorded one at its commit', async (t) => {
  const { fixture, recorded, unrecordedTip } = await fixtureFor(t);
  await ghStub(fixture.binDir, {}, { defaultBranch: 'main' });

  const result = await runRound(fixture, ARGS);
  assert.equal(result.status, 0, show(result));

  for (const name of recorded) {
    assert.equal(await hasRef(fixture.origin, `refs/heads/${name}`), false, `${name} on origin`);
    assert.equal(await hasRef(fixture.dir, `refs/heads/${name}`), false, `${name} as a local ref`);
  }
  assert.equal(await git(fixture.origin, ['rev-parse', `refs/heads/${UNRECORDED}`]), unrecordedTip);

  const state = readJson(fixture.stateFile);
  assert.deepEqual(state.branches, []);
  assert.equal(state.other_branch, null);
  assert.deepEqual(state.runs, RUNS);
  assert.deepEqual(state.tokens, TOKENS);
  assert.equal(lastLine(result.stdout), 'teardown: 3 branch(es) deleted; default branch main confirmed');
});

test('a live default other than the recorded one exits 5 with the gh repo edit command and issues none', async (t) => {
  const { fixture } = await fixtureFor(t);
  // The preflight reads the live default's workflow, so `other` exists on origin carrying the seed.
  await runGit(fixture.dir, ['push', '--quiet', 'origin', 'refs/heads/main:refs/heads/other']);
  await ghStub(fixture.binDir, {}, { defaultBranch: 'other' });

  const result = await runRound(fixture, ARGS);
  assert.equal(result.status, 5, show(result));
  assert.ok(result.stderr.includes(`gh repo edit ${GATE12_SLUG} --default-branch main`), result.stderr);
  const calls = await ghStubCalls(fixture.binDir);
  assert.deepEqual(calls.filter((a) => a[0] === 'repo' && a[1] === 'edit'), [], JSON.stringify(calls));
  assert.match(lastLine(result.stdout), /default branch other not confirmed \(recorded main\)$/);
});

test('a recorded branch origin refuses to delete stays recorded and exits 5; a second teardown deletes it', async (t) => {
  const name = RECORDED[0];
  const { fixture } = await fixtureFor(t, { names: [name], other: null });
  await ghStub(fixture.binDir, {}, { defaultBranch: 'main' });
  await runGit(fixture.origin, ['config', 'receive.denyDeletes', 'true']);

  const refused = await runRound(fixture, ARGS);
  assert.equal(refused.status, 5, show(refused));
  assert.ok(refused.stderr.includes(`push --no-verify origin --delete ${name}`), refused.stderr);
  assert.equal(await hasRef(fixture.origin, `refs/heads/${name}`), true);
  assert.deepEqual(readJson(fixture.stateFile).branches.map((b) => b.name), [name]);
  assert.equal(lastLine(refused.stdout), 'teardown: 0 branch(es) deleted; default branch main confirmed');

  await t.test('once origin allows deletes, the next teardown removes it', async () => {
    await runGit(fixture.origin, ['config', '--unset', 'receive.denyDeletes']);
    const again = await runRound(fixture, ARGS);
    assert.equal(again.status, 0, show(again));
    assert.equal(await hasRef(fixture.origin, `refs/heads/${name}`), false);
    assert.deepEqual(readJson(fixture.stateFile).branches, []);
    assert.equal(lastLine(again.stdout), 'teardown: 1 branch(es) deleted; default branch main confirmed');
  });
});
