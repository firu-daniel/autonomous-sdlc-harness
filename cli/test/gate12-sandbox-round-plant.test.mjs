/**
 * `scripts/gate12-sandbox-round.sh plant`: the plumbing branches, the dispatch and the state file.
 *
 * **The rule this suite enforces: each plant is one pushed branch per arm, built by plumbing from the
 * GitHub default branch's tip and carrying exactly its arm's paths; it is recorded before it is pushed
 * and dispatched through the repository's own `remote-run.sh`; and the operator's checkout, index and
 * `HEAD` are unchanged. A session-made link is planted as a prompt, never as a committed link.**
 *
 * It reads one fixed script, not a tree, so it owes no `treeGuards` entry.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, posix } from 'node:path';
import test from 'node:test';

import { readJson, runGit, WORKSPACE_ROOT } from './helpers/fixture.mjs';
import {
  cleanup,
  GATE12_SLUG,
  ghStub,
  ghStubCalls,
  ghStubRuns,
  makeGate12Fixture,
  runRound,
} from './helpers/gate12-round.mjs';

const STAMP = /^\d{14}$/;

const PLANTS = await readFile(join(WORKSPACE_ROOT, 'scripts', 'lib', 'gate12-sandbox-round', 'plants.sh'), 'utf8');
const PAUSE_TOKEN_FILE = PLANTS.match(/^\s*pause-note\) key=SB2_PAUSE_NOTE file=(\S+) ;;$/m)?.[1];
assert.ok(PAUSE_TOKEN_FILE, "plants.sh no longer names the pause-note arm's token file");
const PAUSE_LINK_SCRIPT = 'scratch/gate12_sb2_pause_link.mjs';

/** Each arm's planted `<new mode> <path>` lines, path-sorted as `diff-tree` lists them. */
const ARMS = [
  { row: 'JS1', arm: 'settings', paths: () => ['100644 .claude/settings.json'] },
  { row: 'JS1', arm: 'remote-run', paths: ({ scriptsDir }) => [`100755 ${scriptsDir}/remote-run.sh`] },
  { row: 'JS4', arm: 'npmrc', paths: () => ['100644 .npmrc', '100644 gate12-js4-marker.cjs'] },
  {
    row: 'JS4',
    arm: 'node-modules',
    paths: () => [
      '120000 node_modules/.bin/autonomous-sdlc-harness',
      '100755 node_modules/autonomous-sdlc-harness/bin.js',
      '100644 node_modules/autonomous-sdlc-harness/package.json',
    ],
  },
  {
    row: 'SB2',
    arm: 'clarifications',
    paths: ({ stateDir }, branch) => [
      '100644 gate12-sb2-token.txt',
      `120000 ${stateDir}/clarifications/${branch}/gate12-link.md`,
    ],
  },
  { row: 'SB2', arm: 'pause-note', paths: () => [`100644 ${PAUSE_TOKEN_FILE}`] },
  { row: 'RJ2', arm: 'profile', paths: () => ['100644 .claude/settings.autonomous.json'] },
];

/** A fixture torn down when the case ends. */
async function fixtureFor(t, options) {
  const fixture = await makeGate12Fixture(options);
  t.after(() => cleanup(fixture));
  return fixture;
}

const git = async (dir, args) => (await runGit(dir, args)).stdout.trim();

/** The `gate12_*` branches on the bare origin, sorted. */
async function originBranches(fixture) {
  const out = await git(fixture.origin, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/gate12_*']);
  return out === '' ? [] : out.split('\n').sort();
}

/** The fixture checkout's status, `HEAD` and index bytes; status takes no index lock, so it never refreshes it. */
async function checkoutState(fixture) {
  const index = await readFile(join(fixture.dir, '.git', 'index'));
  return {
    status: (await runGit(fixture.dir, ['--no-optional-locks', 'status', '--porcelain'])).stdout,
    head: await git(fixture.dir, ['rev-parse', 'HEAD']),
    index: createHash('sha256').update(index).digest('hex'),
  };
}

/** `<new mode> <path>` per entry `diff-tree` lists for `commit` against its parent. */
async function changedPaths(dir, commit) {
  const out = await git(dir, ['diff-tree', '--no-commit-id', '-r', commit]);
  return out.split('\n').map((line) => {
    const [meta, path] = line.split('\t');
    return `${meta.split(' ')[1]} ${path}`;
  });
}

const show = (result) => `status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`;

test('plant with no --row pushes one plumbing branch per arm, dispatches and records each, and leaves the checkout alone', async (t) => {
  const fixture = await fixtureFor(t);
  await ghStub(fixture.binDir, { 'run list': { synthesiseRun: true } });
  const seed = await git(fixture.dir, ['rev-parse', 'refs/remotes/origin/main']);
  const before = await checkoutState(fixture);

  const result = await runRound(fixture, ['plant', '--repo', GATE12_SLUG]);
  assert.equal(result.status, 0, show(result));

  const branches = await originBranches(fixture);
  assert.equal(branches.length, ARMS.length, branches.join('\n'));
  const state = readJson(fixture.stateFile);
  const allotted = ghStubRuns(fixture.binDir);

  for (const { row, arm, paths } of ARMS) {
    await t.test(`${row} ${arm}`, async () => {
      const prefix = `gate12_${row.toLowerCase()}_${arm}_`;
      const named = branches.filter((b) => b.startsWith(prefix) && STAMP.test(b.slice(prefix.length)));
      assert.equal(named.length, 1, `one branch named ${prefix}<stamp> among:\n${branches.join('\n')}`);
      const [branch] = named;

      const tip = await git(fixture.origin, ['rev-parse', `refs/heads/${branch}`]);
      const [, prompt] = (await git(fixture.origin, ['rev-list', '--parents', '-n', '1', tip])).split(' ');
      assert.equal((await git(fixture.origin, ['rev-list', '--parents', '-n', '1', prompt])).split(' ')[1], seed);
      assert.equal(await git(fixture.origin, ['log', '-1', '--format=%s', tip]), `chore: Plant ${row} ${arm} for Gate 12`);
      assert.equal(await git(fixture.origin, ['log', '-1', '--format=%s', prompt]), `chore: add task prompt for ${branch}`);
      assert.deepEqual(await changedPaths(fixture.origin, prompt), [
        `100644 ${fixture.stateDir}/task_prompts/${branch}_task_prompt.md`,
      ]);
      assert.deepEqual(await changedPaths(fixture.origin, tip), paths(fixture, branch));

      assert.deepEqual(state.branches.filter((b) => b.name === branch), [{ name: branch, row, arm, commit: tip }]);
      const runs = state.runs.filter((r) => r.branch === branch);
      assert.equal(runs.length, 1);
      assert.equal(runs[0].row, row);
      assert.equal(runs[0].arm, arm);
      assert.equal(runs[0].run_id, allotted[branch]);
      assert.match(result.stdout, new RegExp(`^planted ${row} ${arm} ${branch} run ${allotted[branch]}$`, 'm'));

      if (row === 'SB2' && arm === 'clarifications') {
        const link = `${fixture.stateDir}/clarifications/${branch}/gate12-link.md`;
        const target = await git(fixture.origin, ['cat-file', 'blob', `${tip}:${link}`]);
        assert.equal(posix.isAbsolute(target), false, target);
        assert.equal(posix.normalize(posix.join(posix.dirname(link), target)), 'gate12-sb2-token.txt');
        assert.match(state.tokens.SB2, /^[0-9a-f]{32}$/);
        assert.equal(await git(fixture.origin, ['cat-file', 'blob', `${tip}:gate12-sb2-token.txt`]), state.tokens.SB2);
      }

      if (row === 'SB2' && arm === 'pause-note') {
        assert.match(state.tokens.SB2_PAUSE_NOTE, /^[0-9a-f]{32}$/);
        assert.equal(await git(fixture.origin, ['cat-file', 'blob', `${tip}:${PAUSE_TOKEN_FILE}`]), state.tokens.SB2_PAUSE_NOTE);

        const clarifications = branches.find((b) => b.startsWith('gate12_sb2_clarifications_'));
        assert.ok(clarifications, branches.join('\n'));
        assert.equal(
          await git(fixture.origin, ['cat-file', 'blob', `refs/heads/${clarifications}:gate12-sb2-token.txt`]),
          state.tokens.SB2,
        );

        const tree = await git(fixture.origin, ['ls-tree', '-r', tip]);
        assert.doesNotMatch(tree, /^120000 /m, tree);

        const promptText = await git(fixture.origin, [
          'cat-file', 'blob', `${prompt}:${fixture.stateDir}/task_prompts/${branch}_task_prompt.md`,
        ]);
        const script = `${fixture.stateDir}/${PAUSE_LINK_SCRIPT}`;
        assert.ok(promptText.includes(`\`${script}\``), promptText);
        assert.ok(promptText.includes(`bash ${fixture.scriptsDir}/scratch-run.sh ${script}`), promptText);
        const ups = '../'.repeat(fixture.stateDir.split('/').filter((s) => s !== '').length);
        assert.ok(promptText.includes(`symlinkSync('${ups}${PAUSE_TOKEN_FILE}', `), promptText);
      }
    });
  }

  await t.test('one dispatch per branch, one distinct run ID per arm', async () => {
    const log = (await readFile(fixture.remoteRunLog, 'utf8')).split('\n').filter((l) => l !== '').sort();
    assert.deepEqual(log, branches.map((b) => `dispatch ${b} --engine task`));
    assert.deepEqual(state.branches.map((b) => b.name).sort(), branches);
    assert.deepEqual(state.runs.map((r) => r.branch).sort(), branches);
    const ids = state.runs.map((r) => r.run_id);
    assert.equal(new Set(ids).size, ARMS.length, ids.join(' '));
    assert.deepEqual(Object.keys(allotted).sort(), branches);
  });

  await t.test("the checkout's status, HEAD and index are byte-identical", async () => {
    assert.deepEqual(await checkoutState(fixture), before);
  });
});

test('plant --row SB4 plants nothing and says so', async (t) => {
  const fixture = await fixtureFor(t);
  await ghStub(fixture.binDir, { 'run list': { synthesiseRun: true } });

  const result = await runRound(fixture, ['plant', '--repo', GATE12_SLUG, '--row', 'SB4']);
  assert.equal(result.status, 0, show(result));
  assert.match(result.stdout, /^not planted SB4: its route is reads-SB2, not plant: /m);
  assert.doesNotMatch(result.stdout, /^planted /m);
  assert.deepEqual(await originBranches(fixture), []);
  assert.equal(await git(fixture.dir, ['for-each-ref', 'refs/heads/gate12_*']), '');
  assert.equal(existsSync(fixture.remoteRunLog), false);
  const state = readJson(fixture.stateFile);
  assert.deepEqual([state.branches, state.runs], [[], []]);
});

test('a second plant --row JS1 refuses the recorded arms and names teardown', async (t) => {
  const fixture = await fixtureFor(t);
  await ghStub(fixture.binDir, { 'run list': { synthesiseRun: true } });
  const args = ['plant', '--repo', GATE12_SLUG, '--row', 'JS1'];

  const first = await runRound(fixture, args);
  assert.equal(first.status, 0, show(first));
  const branches = await originBranches(fixture);
  assert.equal(branches.length, 2, branches.join('\n'));
  const stateBytes = await readFile(fixture.stateFile, 'utf8');
  const logBytes = await readFile(fixture.remoteRunLog, 'utf8');

  const second = await runRound(fixture, args);
  assert.equal(second.status, 2, show(second));
  for (const arm of ['settings', 'remote-run']) {
    const branch = branches.find((b) => b.startsWith(`gate12_js1_${arm}_`));
    assert.ok(branch, `no ${arm} branch among ${branches.join(' ')}`);
    assert.match(second.stderr, new RegExp(`JS1 ${arm} is already planted as ${branch}; run teardown`));
  }
  assert.doesNotMatch(second.stdout, /^planted /m);
  assert.deepEqual(await originBranches(fixture), branches);
  assert.equal(await readFile(fixture.stateFile, 'utf8'), stateBytes);
  assert.equal(await readFile(fixture.remoteRunLog, 'utf8'), logBytes);
});

test('a run lookup that never lists the run exits 3, records run_id null and names the gh run list command', async (t) => {
  const fixture = await fixtureFor(t);
  await ghStub(fixture.binDir, { 'run list': { stdout: '[]\n' } });

  const result = await runRound(fixture, ['plant', '--repo', GATE12_SLUG, '--row', 'RJ2'], {
    env: { G12_RUN_LOOKUP_TRIES: '2', G12_RUN_LOOKUP_DELAY_SECS: '0' },
  });
  assert.equal(result.status, 3, show(result));

  const branches = await originBranches(fixture);
  assert.equal(branches.length, 1, branches.join('\n'));
  const [branch] = branches;
  assert.match(branch, /^gate12_rj2_profile_\d{14}$/);

  const state = readJson(fixture.stateFile);
  assert.deepEqual(state.branches.map((b) => b.name), [branch]);
  assert.equal(state.runs.length, 1);
  assert.equal(state.runs[0].branch, branch);
  assert.equal(state.runs[0].run_id, null);

  const lookup = `gh run list --repo ${GATE12_SLUG} --workflow harness-run.yml --branch ${branch} --json databaseId,createdAt,displayTitle --limit 20`;
  assert.ok(result.stderr.includes(lookup), result.stderr);
  const lookups = (await ghStubCalls(fixture.binDir)).filter((argv) => argv[0] === 'run' && argv[1] === 'list');
  assert.equal(lookups.length, 2);
  assert.match(result.stdout, new RegExp(`^planted RJ2 profile ${branch} run null$`, 'm'));
});
