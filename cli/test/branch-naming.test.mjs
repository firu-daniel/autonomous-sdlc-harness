/**
 * Deriving a branch name from an issue title — `hr_branch_slug`, `hr_branch_name_taken` and
 * `hr_derive_branch` in the generated run library.
 *
 * **The rule these tests exist to enforce: a title folds to ASCII lowercase with every run outside
 * `[a-z0-9]` as one `_`, trimmed and capped at 60; an empty fold takes the caller's fallback; and a
 * name that is protected, live on `origin` in any case, local, left behind as a merged run's
 * artifacts on `origin/<defaultBranch>`, recorded in the registry, or — given a `gh` — the branch of
 * any listed run of the run workflow is never returned — the lowest free `_<n>` is, and a check that
 * cannot tell, a failing run listing included, returns 2 with nothing printed. Without a `gh`, no
 * run listing is made.**
 *
 * The library is sourced out of an `init`-wired fixture, as `cli/test/registry-writer.test.mjs`
 * does, so the copy under test is the one an adopter receives and `npm run build` precedes
 * `npm test`. `origin` is the fixture's own bare sibling, and `gh` is a stub written into the
 * fixture; no case reaches the network.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, test } from 'node:test';

import { createFixture, INIT_SCRIPTS_DIR, runBash, runCli } from './helpers/fixture.mjs';

/** The library's path under the `scriptsDir` a configless `init` writes. */
const LIB_PATH = `${INIT_SCRIPTS_DIR}/lib/harness-run-lib.sh`;

/** A `protectedBranches` glob the suite adds, so a title folding into it is never returned. */
const PROTECTED_GLOB = 'release_v*';

/**
 * `gh`, recorded to `STUB_LOG`. `run list` answers one run for a `--branch` that `STUB_HISTORY` (a JSON
 * array of names) holds and `[]` otherwise; `STUB_FAIL` makes it exit 4.
 */
const GH_STUB = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
if (args[0] === 'run' && args[1] === 'list') {
  if (process.env.STUB_FAIL) {
    process.stderr.write('stub gh failure\\n');
    process.exit(4);
  }
  const branch = args[args.indexOf('--branch') + 1];
  const history = JSON.parse(process.env.STUB_HISTORY ?? '[]');
  process.stdout.write(JSON.stringify(history.includes(branch) ? [{ databaseId: 36569531374 }] : []));
}
`;

const fixtures = [];
let dir = '';
let config = {};

async function initFixture() {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } },
      'README.md': '# fixture project\n',
    },
  });
  fixtures.push(fixture);
  const init = await runCli(fixture.dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  return fixture.dir;
}

/** Source the written library in `root`, then run `script` with the remaining values as `$1`, `$2`, …. */
function libCall(root, script, args = [], env = {}) {
  return runBash(root, ['-c', `. "$1"; shift; ${script}`, '_', join(root, LIB_PATH), ...args], env);
}

let stubs = 0;

/** Write the `gh` stub under the fixture's gitignored state directory, with a fresh, empty log. */
function ghStub() {
  const stubDir = join(dir, config.stateDir, 'gh-stub');
  mkdirSync(stubDir, { recursive: true });
  const gh = join(stubDir, 'gh');
  writeFileSync(gh, GH_STUB, { mode: 0o755 });
  stubs += 1;
  const log = join(stubDir, `gh_${stubs}.log`);
  writeFileSync(log, '');
  return { gh, log };
}

/** Run a shell `script` in the fixture, asserting it succeeds. */
async function sh(script, args = []) {
  const result = await runBash(dir, ['-c', script, '_', ...args]);
  assert.equal(result.status, 0, `${script} exited ${result.status}: ${result.stderr}`);
  return result.stdout;
}

/** `hr_derive_branch` in the main fixture: `{ status, stdout }`. */
async function derive(title, fallback = 'issue_7', registry = '') {
  const result = await libCall(dir, 'hr_derive_branch "$PWD" "$@"', [title, fallback, registry]);
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** Push the origin default branch's commit to `origin` as `name`. */
function pushBranch(name) {
  return sh('git push --quiet origin "refs/remotes/origin/$1:refs/heads/$2"', [config.defaultBranch, name]);
}

before(async () => {
  dir = await initFixture();
  config = JSON.parse(readFileSync(join(dir, 'harness.config.json'), 'utf8'));
  config.protectedBranches = [...(config.protectedBranches ?? []), PROTECTED_GLOB];
  writeFileSync(join(dir, 'harness.config.json'), `${JSON.stringify(config, null, 2)}\n`);
});

after(async () => {
  for (const fixture of fixtures) await fixture.cleanup();
});

test('the slug folds a title to ASCII lowercase with one `_` per separator run', async () => {
  const cases = [
    ['Version bump', 'version_bump'],
    ['feat: move button to the bottom of the page', 'feat_move_button_to_the_bottom_of_the_page'],
    ['PROJ-123: Fix login', 'proj_123_fix_login'],
    ['  --Café au lait!! ', 'caf_au_lait'],
  ];
  for (const [title, slug] of cases) {
    const result = await libCall(dir, 'hr_branch_slug "$1"', [title]);
    assert.equal(result.status, 0, `hr_branch_slug ${JSON.stringify(title)} exited ${result.status}`);
    assert.equal(result.stdout, `${slug}\n`, `the slug of ${JSON.stringify(title)}`);
  }
});

test('the slug is capped at 60 characters and a `_` the cut exposes is trimmed', async () => {
  const title = `${'a'.repeat(59)} ${'b'.repeat(20)}`;
  const result = await libCall(dir, 'hr_branch_slug "$1"', [title]);
  assert.equal(result.stdout, `${'a'.repeat(59)}\n`);
});

test('an emoji-only title folds to nothing and the derivation takes the fallback', async () => {
  const slug = await libCall(dir, 'hr_branch_slug "$1"', ['🚀🚀']);
  assert.equal(slug.status, 1);
  assert.equal(slug.stdout, '');
  assert.deepEqual(await derive('🚀🚀', 'issue_7'), { status: 0, stdout: 'issue_7\n', stderr: '' });
});

test('a second issue with the same title gets the next indexed name', async () => {
  assert.equal((await derive('Version bump')).stdout, 'version_bump\n');
  await pushBranch('version_bump');
  const taken = await libCall(dir, 'hr_branch_name_taken "$PWD" "$1"; s=$?; echo "$s $HR_TAKEN_WHY"', ['version_bump']);
  assert.equal(taken.stdout, '0 a branch on origin\n');
  assert.deepEqual(await derive('Version bump'), { status: 0, stdout: 'version_bump_2\n', stderr: '' });
});

test('a branch on origin in another case takes the lowercase name', async () => {
  await pushBranch('Release_Notes');
  assert.equal((await derive('Release notes')).stdout, 'release_notes_2\n');
});

test('a local branch takes the name', async () => {
  await sh('git branch "$1" "refs/remotes/origin/$2"', ['local_only', config.defaultBranch]);
  assert.equal((await derive('Local only')).stdout, 'local_only_2\n');
});

test('a merged and deleted branch\'s task prompt on the default branch never lets its name be reused', async () => {
  await sh('git push --quiet origin ":refs/heads/version_bump"');
  // Commit the artifact onto origin's default branch without touching the fixture's working tree.
  // `--no-verify` skips the pre-push hook `init` wired, which refuses the protected default branch.
  await sh(
    [
      'set -e',
      'export GIT_INDEX_FILE="$PWD/.git/branch-naming-index"',
      'git read-tree "refs/remotes/origin/$1"',
      'blob=$(printf "prompt\\n" | git hash-object -w --stdin)',
      'git update-index --add --cacheinfo "100644,$blob,$2/task_prompts/version_bump_task_prompt.md"',
      'tree=$(git write-tree)',
      'commit=$(git commit-tree "$tree" -p "refs/remotes/origin/$1" -m merged)',
      'git push --quiet --no-verify origin "$commit:refs/heads/$1"',
      'rm -f "$GIT_INDEX_FILE"',
    ].join('\n'),
    [config.defaultBranch, config.stateDir.replace(/\/$/, '')],
  );
  const taken = await libCall(dir, 'hr_branch_name_taken "$PWD" "$1"; s=$?; echo "$s $HR_TAKEN_WHY"', ['version_bump']);
  assert.equal(taken.stdout, '0 a run\'s artifacts on the default branch\n');
  assert.equal((await derive('Version bump')).stdout, 'version_bump_2\n');
});

test('the default branch and a protectedBranches glob are never returned', async () => {
  const main = await derive(config.defaultBranch);
  assert.equal(main.status, 0);
  assert.equal(main.stdout, `${config.defaultBranch}_2\n`);
  // Every suffix of `release_v2` still matches the glob, so no name is free.
  assert.deepEqual(await derive('Release v2'), { status: 3, stdout: '', stderr: '' });
});

test('a registry record takes the name, and an absent registry is not created', async () => {
  const registry = join(dir, 'registry.json');
  writeFileSync(registry, `${JSON.stringify({ runs: { queued_job: { branch: 'queued_job' } } })}\n`);
  const taken = await libCall(dir, 'hr_branch_name_taken "$PWD" "$@"; s=$?; echo "$s $HR_TAKEN_WHY"', ['queued_job', registry]);
  assert.equal(taken.stdout, '0 a run registry record\n');
  assert.equal((await derive('Queued job', 'issue_7', registry)).stdout, 'queued_job_2\n');

  const absent = join(dir, 'no-registry.json');
  assert.equal((await derive('Queued job', 'issue_7', absent)).stdout, 'queued_job\n');
  assert.equal(existsSync(absent), false, 'the derivation created a registry');
});

test('a failing ls-remote returns 2 with nothing printed', async () => {
  const unreachable = await initFixture();
  const set = await runBash(unreachable, ['-c', 'git remote set-url origin "$1"', '_', join(unreachable, 'no-such-origin.git')]);
  assert.equal(set.status, 0);
  const derived = await libCall(unreachable, 'hr_derive_branch "$PWD" "$@"', ['Version bump', 'issue_7']);
  assert.deepEqual({ status: derived.status, stdout: derived.stdout }, { status: 2, stdout: '' });
  const taken = await libCall(unreachable, 'hr_branch_name_taken "$PWD" "$1"', ['version_bump']);
  assert.equal(taken.status, 2);
});

test('a name with run-workflow history is taken, and the derivation takes `_2`', async () => {
  const { gh, log } = ghStub();
  const env = { STUB_LOG: log, STUB_HISTORY: JSON.stringify(['feat_invoices']) };
  const taken = await libCall(dir, 'hr_branch_name_taken "$PWD" "$@"; s=$?; echo "$s $HR_TAKEN_WHY"', ['feat_invoices', '', gh], env);
  assert.equal(taken.stdout, '0 a run of the run workflow listed under that name\n');
  const derived = await libCall(dir, 'hr_derive_branch "$PWD" "$@"', ['feat: invoices', 'issue_7', '', gh], env);
  assert.deepEqual({ status: derived.status, stdout: derived.stdout }, { status: 0, stdout: 'feat_invoices_2\n' });
  const calls = readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.deepEqual(calls.at(-1), ['run', 'list', '--workflow', 'harness-run.yml', '--branch', 'feat_invoices_2', '--limit', '1', '--json', 'databaseId']);
});

test('history on both `<name>` and `<name>_2` derives `<name>_3`', async () => {
  const { gh, log } = ghStub();
  const env = { STUB_LOG: log, STUB_HISTORY: JSON.stringify(['feat_receipts', 'feat_receipts_2']) };
  const derived = await libCall(dir, 'hr_derive_branch "$PWD" "$@"', ['feat: receipts', 'issue_7', '', gh], env);
  assert.deepEqual({ status: derived.status, stdout: derived.stdout }, { status: 0, stdout: 'feat_receipts_3\n' });
});

test('a run listing that fails returns 2 with nothing printed and names the run history', async () => {
  const { gh, log } = ghStub();
  const env = { STUB_LOG: log, STUB_FAIL: '1' };
  const derived = await libCall(dir, 'hr_derive_branch "$PWD" "$@"; s=$?; echo "$s $HR_TAKEN_WHY"', ['feat: invoices', 'issue_7', '', gh], env);
  assert.equal(derived.stdout, '2 the run history of feat_invoices could not be listed\n');
});

test('without a `gh` the same fixture derives the bare name and lists no runs', async () => {
  const { log } = ghStub();
  const env = { STUB_LOG: log, STUB_HISTORY: JSON.stringify(['feat_invoices']) };
  const derived = await libCall(dir, 'hr_derive_branch "$PWD" "$@"', ['feat: invoices', 'issue_7'], env);
  assert.deepEqual({ status: derived.status, stdout: derived.stdout }, { status: 0, stdout: 'feat_invoices\n' });
  assert.equal(readFileSync(log, 'utf8'), '', 'the stub was called');
});
