/**
 * `remote-run.sh save`, the job's post-session bundle step, driven through the `init`-written script
 * against a state directory in which a sandboxed session has replaced bundle sources with symbolic
 * links.
 *
 * **The rule these tests exist to enforce: a symbolic link a sandboxed session planted under the
 * state directory never carries a byte of its target, or a link, into the `harness-state` bundle, an
 * honest source beside it is still saved byte-for-byte, and `save` reads the state directory the
 * trusted configuration names.**
 *
 * The sentinel is one file **outside** the fixture's state directory whose bytes carry a random
 * token. It is shaped as a registry whose `feat_x` record's `engine` is the token, so a status
 * derived from it carries the token too. Each case links one honest source to the sentinel, or to an
 * outside directory holding it. The bundle is then walked with `lstat`, following nothing: no entry
 * may be a link, no file may contain the token, and the file set and each file's bytes must be
 * exactly the honest sources the case left in place. `gh` is a recorder stub through
 * `HARNESS_GH_CLI`, and every case but (T) passes `HARNESS_GITHUB_DEFAULT_COMMIT` empty so that an
 * ambient value cannot select trusted mode.
 *
 * RED ONCE — each mutation applied once to `cli/templates/scripts/lib/harness-run-lib.sh` (M3 and
 * M4's second half: to `remote-run.sh`), the file run, the failure observed, the mutation reverted:
 * - (M1) `hr_remote_bundle_source_ok` run only for a directory source (`[ -d … ] || return 0`
 *   ahead of its `hr_remote_link_free_var`) → (F) fails on each of its four sources, `the
 *   sentinel's bytes are in the bundle: PAUSE_PROGRESS.md` (`flow_walker_state`, `run.log`,
 *   `status.json`), and (P)'s file half on `planning/story_plans/feat_x_story_plan.md`. (D), (N),
 *   (P)'s directory half, (U), (R) and (T) stay green.
 * - (M2) `cp -R … 2>/dev/null` restored in place of both `hr_remote_copy_tree` calls, the link
 *   test intact → (N) fails, `a link is in the bundle: clarifications/feat_x/question_2.md`. Every
 *   other case stays green: the link test refuses (D), (U) and (P)'s directory half first.
 * - (M3) `remote-run.sh` → `verb_save`'s `save_link_free autonomous_logs/registry.json` disabled
 *   → (R) fails, `the sentinel's bytes are in the bundle: status.json`: the library derived the
 *   status from the linked registry. Every other case stays green.
 * - (M4) `state=$(hr_state_dir "$root")` in place of `hr_remote_bundle_write`'s
 *   `state=$HR_REMOTE_STATE_DIR` → (T) fails, `the sentinel's bytes are in the bundle:
 *   PAUSE_PROGRESS.md`. Separately, `remote-run.sh`'s setup gate restored to `hr_state_path` and
 *   `verb_save` to `HR_REMOTE_STATE_DIR=$(hr_state_dir "$root")` with no `remote_state_difference`
 *   → (T) fails, `no difference line`. Every other case stays green under both.
 * - (M5) `hr_remote_bundle_source_ok` run only for a non-directory source (`[ -d … ] && return 0`
 *   ahead of its `hr_remote_link_free_var`), `hr_remote_copy_tree` intact → (U) fails, `the
 *   sentinel's bytes are in the bundle: clarifications/feat_x/question_1.md`. (D) and (P)'s
 *   directory half fail too, though not on a leak: `hr_remote_copy_tree` refuses a linked top-level
 *   source by returning 1 with no skip line, so `hr_remote_bundle_write` stops there. (D) fails on
 *   `the bundle's file set`, holding only `status.json`; (P)'s directory half on `no skip line for
 *   …/sdlc-harness/task_plans/feat_x`. (F), (N), (P)'s file half, (R) and (T) stay green.
 * - (M6) M5 and M2 together → (D) fails, `a link is in the bundle: clarifications/feat_x`; (P)'s
 *   directory half, `a link is in the bundle: planning/task_plans/feat_x`; (N), `a link is in the
 *   bundle: clarifications/feat_x/question_2.md`; (U), `the sentinel's bytes are in the bundle:
 *   clarifications/feat_x/question_1.md`. (F), (P)'s file half, (R) and (T) stay green.
 */

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { createFixture, INIT_SCRIPTS_DIR, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = `${INIT_SCRIPTS_DIR}/remote-run.sh`;
const STATE_DIR = 'sdlc-harness';
const REGISTRY = 'autonomous_logs/registry.json';
const STATUS_SOURCE = 'autonomous_logs/remote_status.json';

/** `gh`, recorded: each argument vector appended to `STUB_LOG`; nothing answers. */
const GH_STUB = `#!/usr/bin/env node
require('node:fs').appendFileSync(process.env.STUB_LOG, JSON.stringify(process.argv.slice(2)) + '\\n');
`;

/** State-directory-relative source → its path in the bundle, for every honest source but the status. */
const COPIED = Object.freeze({
  'clarifications/feat_x/question_1.md': 'clarifications/feat_x/question_1.md',
  'PAUSE_PROGRESS.md': 'PAUSE_PROGRESS.md',
  '.flow_walker_state': 'flow_walker_state',
  'autonomous_logs/feat_x.log': 'run.log',
  'story_plans/feat_x_story_plan.md': 'planning/story_plans/feat_x_story_plan.md',
  'task_plans/feat_x/task_1_plan.md': 'planning/task_plans/feat_x/task_1_plan.md',
});

/** Write `content` at `path`, creating its parents. */
function put(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/**
 * An `init`-wired fixture with `execution.target` `github-actions`, a recorder `gh`, the honest
 * sources seeded under `stateDir` (`state`, default `sdlc-harness`), and the sentinel beside it.
 *
 * @param {import('node:test').TestContext} t
 */
async function saveFixture(t, state = STATE_DIR) {
  const fixture = await createFixture({
    files: { 'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } } },
  });
  t.after(fixture.cleanup);
  const { dir } = fixture;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  const configPath = join(dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.execution = { target: 'github-actions' };
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

  const outside = `${dir}-outside`;
  const stubDir = `${dir}-stub`;
  const out = `${dir}-bundle`;
  for (const path of [outside, stubDir, out]) t.after(() => rmSync(path, { recursive: true, force: true }));
  mkdirSync(outside);
  mkdirSync(stubDir);
  const token = `sentinel-${randomUUID()}`;
  const sentinel = join(outside, 'sentinel.json');
  writeFileSync(sentinel, JSON.stringify({ runs: { feat_x: { branch: 'feat_x', status: 'parked', engine: token } } }));
  const stub = join(stubDir, 'gh');
  writeFileSync(stub, GH_STUB, { mode: 0o755 });

  const base = join(dir, state);
  put(join(base, REGISTRY), JSON.stringify({
    runs: { feat_x: { branch: 'feat_x', status: 'parked', engine: 'task', execution: 'github-actions', worktree: dir } },
  }));
  const wrote = await runBash(dir, ['-c',
    `. ${INIT_SCRIPTS_DIR}/lib/harness-run-lib.sh && hr_remote_status_write "$1" feat_x "$2" stop "parked | on a question"`,
    '_', `${state}/${REGISTRY}`, `${state}/${STATUS_SOURCE}`], { GITHUB_RUN_ID: '' });
  assert.equal(wrote.status, 0, wrote.stderr);
  for (const rel of Object.keys(COPIED)) put(join(base, rel), `honest ${rel}\n`);

  return {
    dir,
    base,
    outside,
    out,
    token,
    sentinel,
    stub,
    stubLog: join(stubDir, 'gh.log'),
    /** The honest bundle: bundle path → the bytes its source holds now. */
    honest() {
      const expected = { 'status.json': readFileSync(join(base, STATUS_SOURCE)) };
      for (const [rel, at] of Object.entries(COPIED)) expected[at] = readFileSync(join(base, rel));
      return expected;
    },
    /** Replace the source at `rel` with a link to `target`. */
    plant(rel, target) {
      const path = join(base, rel);
      rmSync(path, { recursive: true, force: true });
      mkdirSync(dirname(path), { recursive: true });
      symlinkSync(target, path);
      return path;
    },
    save(env = {}) {
      return runBash(dir, [SCRIPT, 'save', 'feat_x', out], {
        HARNESS_GH_CLI: stub,
        STUB_LOG: join(stubDir, 'gh.log'),
        HARNESS_GITHUB_DEFAULT_COMMIT: '',
        GITHUB_RUN_ID: '',
        GITHUB_STEP_SUMMARY: '',
        ...env,
      });
    },
  };
}

/** Every entry under `root`, keyed by bundle-relative path, read with `lstat` and never followed. */
function walk(root, prefix = '', into = {}) {
  for (const name of readdirSync(join(root, prefix))) {
    const rel = prefix === '' ? name : `${prefix}/${name}`;
    const stat = lstatSync(join(root, rel));
    if (stat.isSymbolicLink()) into[rel] = 'link';
    else if (stat.isDirectory()) walk(root, rel, into);
    else into[rel] = readFileSync(join(root, rel));
  }
  return into;
}

/**
 * Assert that `fx.out` holds no link and no byte of the sentinel, and exactly the files `expected`
 * names: a `Buffer` value is compared byte-for-byte, `null` only for presence. Returns the walk.
 */
function assertBundle(fx, expected, stderr) {
  const found = walk(fx.out);
  for (const [rel, bytes] of Object.entries(found)) {
    assert.notEqual(bytes, 'link', `a link is in the bundle: ${rel}\n${stderr}`);
    assert.equal(bytes.includes(fx.token), false, `the sentinel's bytes are in the bundle: ${rel}\n${stderr}`);
  }
  assert.deepEqual(Object.keys(found).sort(), Object.keys(expected).sort(), `the bundle's file set\n${stderr}`);
  for (const [rel, bytes] of Object.entries(expected)) {
    if (bytes !== null) assert.ok(bytes.equals(found[rel]), `${rel} is not the honest source's bytes\n${stderr}`);
  }
  return found;
}

/** Assert stderr carries a skip line naming `path` and its first linked component `linked`. */
function assertSkipped(stderr, path, linked = path) {
  assert.ok(stderr.includes(`skipped ${path}: ${linked} is a symbolic link`), `no skip line for ${path}\n${stderr}`);
}

/** Drop `at` from the honest map. */
function without(expected, ...at) {
  for (const key of at) delete expected[key];
  return expected;
}

test('an honest state directory is saved with its exact layout and bytes', async (t) => {
  const fx = await saveFixture(t);
  const result = await fx.save();
  assert.equal(result.status, 0, result.stderr);
  assertBundle(fx, fx.honest(), result.stderr);
  assert.doesNotMatch(result.stderr, /symbolic link/);
  assert.equal(existsSync(fx.stubLog), false, 'save called gh');
});

test('(F) a linked file source is skipped, and every other source is saved', async (t) => {
  for (const [rel, at] of Object.entries(COPIED)) {
    if (!['PAUSE_PROGRESS.md', '.flow_walker_state', 'autonomous_logs/feat_x.log'].includes(rel)) continue;
    await t.test(rel, async (st) => {
      const fx = await saveFixture(st);
      const expected = without(fx.honest(), at);
      const path = fx.plant(rel, fx.sentinel);
      const result = await fx.save();
      assert.equal(result.status, 0, result.stderr);
      assertBundle(fx, expected, result.stderr);
      assertSkipped(result.stderr, path);
    });
  }

  await t.test(STATUS_SOURCE, async (st) => {
    const fx = await saveFixture(st);
    const expected = { ...fx.honest(), 'status.json': null };
    const path = fx.plant(STATUS_SOURCE, fx.sentinel);
    const result = await fx.save();
    assert.equal(result.status, 0, result.stderr);
    const found = assertBundle(fx, expected, result.stderr);
    const status = JSON.parse(found['status.json'].toString('utf8'));
    assert.equal(status.decision, 'stop');
    assert.equal(status.status, 'parked');
    assert.ok(!found['status.json'].equals(readFileSync(fx.sentinel)), 'status.json is the sentinel');
    assertSkipped(result.stderr, path);
    assert.equal(result.stderr.split(`skipped ${path}: `).length - 1, 1, `the skip line for ${path} is not printed exactly once\n${result.stderr}`);
  });
});

test('(D) a linked clarification directory is skipped, and every other source is saved', async (t) => {
  const fx = await saveFixture(t);
  const expected = without(fx.honest(), 'clarifications/feat_x/question_1.md');
  put(join(fx.outside, 'clar', 'question_1.md'), readFileSync(fx.sentinel));
  const path = fx.plant('clarifications/feat_x', join(fx.outside, 'clar'));
  const result = await fx.save();
  assert.equal(result.status, 0, result.stderr);
  assertBundle(fx, expected, result.stderr);
  assertSkipped(result.stderr, path);
});

test('(N) links inside a real clarification directory are neither copied nor followed', async (t) => {
  const fx = await saveFixture(t);
  const expected = fx.honest();
  const clar = join(fx.base, 'clarifications', 'feat_x');
  put(join(fx.outside, 'nested', 'question_3.md'), readFileSync(fx.sentinel));
  symlinkSync(fx.sentinel, join(clar, 'question_2.md'));
  symlinkSync(join(fx.outside, 'nested'), join(clar, 'sub'));
  const result = await fx.save();
  assert.equal(result.status, 0, result.stderr);
  assertBundle(fx, expected, result.stderr);
  assertSkipped(result.stderr, join(clar, 'question_2.md'));
  assertSkipped(result.stderr, join(clar, 'sub'));
});

test('(P) a linked planning path is skipped, and every other source is saved', async (t) => {
  await t.test('file half: story_plans/feat_x_story_plan.md', async (st) => {
    const fx = await saveFixture(st);
    const expected = without(fx.honest(), 'planning/story_plans/feat_x_story_plan.md');
    const path = fx.plant('story_plans/feat_x_story_plan.md', fx.sentinel);
    const result = await fx.save();
    assert.equal(result.status, 0, result.stderr);
    assertBundle(fx, expected, result.stderr);
    assertSkipped(result.stderr, path);
  });

  await t.test('directory half: task_plans/feat_x', async (st) => {
    const fx = await saveFixture(st);
    const expected = without(fx.honest(), 'planning/task_plans/feat_x/task_1_plan.md');
    put(join(fx.outside, 'plans', 'task_1_plan.md'), readFileSync(fx.sentinel));
    const path = fx.plant('task_plans/feat_x', join(fx.outside, 'plans'));
    const result = await fx.save();
    assert.equal(result.status, 0, result.stderr);
    assertBundle(fx, expected, result.stderr);
    assertSkipped(result.stderr, path);
  });
});

test('(U) a source under a linked parent directory is skipped, and every other source is saved', async (t) => {
  const fx = await saveFixture(t);
  const expected = without(fx.honest(), 'clarifications/feat_x/question_1.md');
  put(join(fx.outside, 'clarifications', 'feat_x', 'question_1.md'), readFileSync(fx.sentinel));
  const linked = fx.plant('clarifications', join(fx.outside, 'clarifications'));
  const result = await fx.save();
  assert.equal(result.status, 0, result.stderr);
  assertBundle(fx, expected, result.stderr);
  assertSkipped(result.stderr, join(fx.base, 'clarifications', 'feat_x'), linked);
});

test('(R) a linked registry with no status source leaves the never-started empty bundle', async (t) => {
  const fx = await saveFixture(t);
  rmSync(join(fx.base, STATUS_SOURCE));
  const path = fx.plant(REGISTRY, fx.sentinel);
  const result = await fx.save();
  assert.equal(result.status, 0, result.stderr);
  assertBundle(fx, {}, result.stderr);
  assertSkipped(result.stderr, path);
  assert.match(result.stderr, /never started/);
});

test('(T) save reads the stateDir of the trusted configuration, not the checkout\'s', async (t) => {
  const fx = await saveFixture(t);
  const expected = fx.honest();
  for (const args of [['add', 'harness.config.json'], ['commit', '--quiet', '--no-verify', '-m', 'fixture: trusted configuration']]) {
    const ran = await runGit(fx.dir, args);
    assert.equal(ran.status, 0, ran.stderr);
  }
  const commit = (await runGit(fx.dir, ['rev-parse', 'HEAD'])).stdout.trim();

  const configPath = join(fx.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.stateDir = 'planted-state';
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  const planted = join(fx.dir, 'planted-state');
  const sentinelBytes = readFileSync(fx.sentinel);
  for (const rel of [REGISTRY, STATUS_SOURCE, ...Object.keys(COPIED)]) put(join(planted, rel), sentinelBytes);

  const result = await fx.save({ HARNESS_GITHUB_DEFAULT_COMMIT: commit });
  assert.equal(result.status, 0, result.stderr);
  assertBundle(fx, expected, result.stderr);
  assert.ok(
    result.stderr.includes(`remote-run.sh: save: the checkout's harness.config.json names stateDir 'planted-state', the trusted configuration at ${commit} names '${STATE_DIR}'; using '${STATE_DIR}'`),
    `no difference line\n${result.stderr}`,
  );
});
