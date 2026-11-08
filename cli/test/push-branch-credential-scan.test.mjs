/**
 * The written `push-branch.sh`'s credential scan and its in-job workflow-file check, against a
 * fixture `init` adopted and its throwaway bare origin.
 *
 * **The rule these tests exist to enforce: a commit carrying a credential never reaches the remote,
 * and the wrapper still exits 0.** In a job — the job push-credential marker set in the main
 * `.git/config` — a commit changing a file under the root workflow directory never reaches it
 * either. Every case is graded on the bare remote's refs, never on the exit status alone.
 *
 * Every case runs under a fake `HOME` and `XDG_CONFIG_HOME` and blanks the four token variables, so
 * the host's own credentials are never a source. The marker is set by sourcing the fixture's copy
 * of the run library and naming its own constants, so this suite cannot drift from their owner.
 */

import assert from 'node:assert/strict';
import { mkdirSync, readdirSync, readFileSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import { createFixture, INIT_SCRIPTS_DIR, runBash, runCli, runGit } from './helpers/fixture.mjs';

const SCRIPT = join(INIT_SCRIPTS_DIR, 'push-branch.sh');
const LIB = join(INIT_SCRIPTS_DIR, 'lib', 'harness-run-lib.sh');
const BRANCH = 'feat_x';
const TOKEN = 'ghs_example0123456789abcdef';
const TOKEN_B64 = Buffer.from(`x-access-token:${TOKEN}`).toString('base64');
const NO_HOOKS = ['-c', 'core.hooksPath=/dev/null'];

/** An adopted fixture on `feat_x`, with one commit `origin` has not seen and a fake `HOME`. */
async function adoptedFixture(t) {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } },
      'README.md': '# fixture project\n',
    },
  });
  t.after(fixture.cleanup);
  const { dir } = fixture;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  await runGit(dir, ['checkout', '--quiet', '-b', BRANCH]);
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '--quiet', '--allow-empty', '-m', 'fixture: work on feat_x']);

  const scratch = await realpath(await mkdtemp(join(tmpdir(), 'harness-cred-scan-')));
  t.after(() => rm(scratch, { recursive: true, force: true }));
  const home = join(scratch, 'home');
  mkdirSync(home);
  const baseEnv = {
    HOME: home,
    XDG_CONFIG_HOME: join(home, '.config'),
    GH_TOKEN: '',
    GITHUB_TOKEN: '',
    HARNESS_PR_TOKEN: '',
    HARNESS_GIT_TOKEN: '',
    GITHUB_ACTIONS: '',
    PUSH_RETRY_DELAY_SECS: '0',
  };
  const origin = `${dir}-origin.git`;
  const git = async (args) => (await runGit(dir, args)).stdout.trim();
  return {
    dir,
    origin,
    home,
    scratch,
    push: (env = {}) => runBash(dir, [join(dir, SCRIPT), dir], { ...baseEnv, ...env }),
    async commitFile(path, content, message = `add ${path}`) {
      mkdirSync(join(dir, path, '..'), { recursive: true });
      writeFileSync(join(dir, path), content);
      await runGit(dir, ['add', '--', path]);
      await runGit(dir, ['commit', '--quiet', '-m', message]);
    },
    async setMarker() {
      const r = await runBash(dir, [
        '-c',
        '. "$1" && git -C "$2" config "$HR_PUSH_CREDENTIAL_KEY" "$HR_PUSH_CREDENTIAL_JOB_TOKEN"',
        'bash',
        join(dir, LIB),
        dir,
      ]);
      assert.equal(r.status, 0, output(r));
    },
    head: () => git(['rev-parse', 'HEAD']),
    originTip: async () =>
      (await runBash(origin, ['-c', `git rev-parse --verify --quiet refs/heads/${BRANCH}`])).stdout.trim(),
    records() {
      const d = join(dir, '.git', 'harness-push-refusals');
      if (!existsSync(d)) return [];
      return readdirSync(d)
        .filter((n) => n.endsWith('.refusal'))
        .map((n) => readFileSync(join(d, n), 'utf8'));
    },
    git,
  };
}

const output = (result) => `${result.stdout}\n${result.stderr}`;

/** Refused: exit 0, origin unchanged, one refusal line carrying `pattern`, one record for the branch. */
async function assertRefused(f, result, before, pattern) {
  assert.equal(result.status, 0, output(result));
  assert.equal(await f.originTip(), before, output(result));
  assert.match(result.stdout, pattern, output(result));
  assert.doesNotMatch(result.stdout, /pushed feat_x/, output(result));
  const records = f.records();
  assert.equal(records.length, 1, output(result));
  assert.match(records[0], new RegExp(`^branch=${BRANCH}\\nreason=refusing to push: `));
  return records[0];
}

function assertNoValue(result, ...values) {
  for (const value of values) assert.ok(!output(result).includes(value), `the output carries a value:\n${output(result)}`);
}

async function assertPushed(f, result) {
  assert.equal(result.status, 0, output(result));
  assert.match(result.stdout, /push-branch\.sh: pushed feat_x to origin/, output(result));
  assert.equal(await f.originTip(), await f.head());
  assert.deepEqual(f.records(), []);
}

const CREDENTIAL = (label, form) =>
  new RegExp(
    `push-branch\\.sh: refusing to push: the commits to send carry a credential \\(${label}, ${form}\\); nothing was pushed`,
  );

test('the job token, raw: refused, labelled, no value printed', async (t) => {
  const f = await adoptedFixture(t);
  const before = await f.originTip();
  await f.commitFile('t.txt', `${TOKEN}\n`);
  const r = await f.push({ GH_TOKEN: TOKEN });
  await assertRefused(f, r, before, CREDENTIAL('the job token', 'raw'));
  assertNoValue(r, TOKEN);
});

test('the job token, base64 form: refused, the line names base64', async (t) => {
  const f = await adoptedFixture(t);
  const before = await f.originTip();
  await f.commitFile('t.txt', `${TOKEN_B64}\n`);
  const r = await f.push({ GITHUB_TOKEN: TOKEN });
  await assertRefused(f, r, before, CREDENTIAL('the job token', 'base64'));
  assertNoValue(r, TOKEN, TOKEN_B64);
});

test('a persisted extraheader in the main .git/config: its token is refused', async (t) => {
  const f = await adoptedFixture(t);
  const before = await f.originTip();
  await runGit(f.dir, ['config', 'http.https://github.com/.extraheader', `AUTHORIZATION: basic ${TOKEN_B64}`]);
  await f.commitFile('t.txt', `${TOKEN}\n`);
  const r = await f.push();
  await assertRefused(f, r, before, CREDENTIAL('the persisted extraheader', 'raw'));
  assertNoValue(r, TOKEN, TOKEN_B64);
});

test('a password from the fake HOME .git-credentials: refused', async (t) => {
  const f = await adoptedFixture(t);
  const before = await f.originTip();
  const password = 'hunter2-long-password';
  writeFileSync(join(f.home, '.git-credentials'), `https://someone:${password}@example.invalid\n`);
  await f.commitFile('t.txt', `${password}\n`);
  const r = await f.push();
  await assertRefused(f, r, before, CREDENTIAL('a stored git credential', 'raw'));
  assertNoValue(r, password);
});

test('the job case: no token in the environment, only a store file the main .git/config names', async (t) => {
  const f = await adoptedFixture(t);
  const before = await f.originTip();
  const store = join(f.scratch, 'job-credentials');
  writeFileSync(store, `https://x-access-token:${TOKEN}@github.com\n`);
  await runGit(f.dir, ['config', 'credential.https://github.com/owner/repo.helper', `store --file ${store}`]);
  assert.deepEqual(readdirSync(f.home), []);
  await f.commitFile('t.txt', `${TOKEN}\n`);
  const r = await f.push();
  await assertRefused(f, r, before, CREDENTIAL('a stored git credential', 'raw'));
  assertNoValue(r, TOKEN);
});

test('a token in a commit message rather than a file: refused', async (t) => {
  const f = await adoptedFixture(t);
  const before = await f.originTip();
  await runGit(f.dir, ['commit', '--quiet', '--allow-empty', '-m', `note ${TOKEN}`]);
  const r = await f.push({ GH_TOKEN: TOKEN });
  await assertRefused(f, r, before, CREDENTIAL('the job token', 'raw'));
  assertNoValue(r, TOKEN);
});

test('a token in the second of two unpushed commits: neither is pushed', async (t) => {
  const f = await adoptedFixture(t);
  const before = await f.originTip();
  await f.commitFile('clean.txt', 'clean\n');
  await f.commitFile('t.txt', `${TOKEN}\n`);
  const r = await f.push({ GH_TOKEN: TOKEN });
  await assertRefused(f, r, before, CREDENTIAL('the job token', 'raw'));
});

test('an already-pushed commit carrying the token is outside the range: a clean branch pushes', async (t) => {
  const f = await adoptedFixture(t);
  await f.commitFile('t.txt', `${TOKEN}\n`);
  const first = await f.push();
  await assertPushed(f, first);
  await f.commitFile('clean.txt', 'clean\n');
  const r = await f.push({ GH_TOKEN: TOKEN });
  await assertPushed(f, r);
});

test('fail closed: a scan that cannot run (no grep on PATH) is refused, with a record', async (t) => {
  const f = await adoptedFixture(t);
  const before = await f.originTip();
  const bin = join(f.scratch, 'bin');
  mkdirSync(bin);
  for (const d of (process.env.PATH ?? '').split(delimiter)) {
    if (d === '' || !existsSync(d)) continue;
    let names;
    try {
      names = readdirSync(d);
    } catch {
      continue;
    }
    for (const name of names) {
      if (/^[ef]?grep$/.test(name) || existsSync(join(bin, name))) continue;
      symlinkSync(join(d, name), join(bin, name));
    }
  }
  await f.commitFile('clean.txt', 'clean\n');
  const r = await f.push({ GH_TOKEN: TOKEN, PATH: bin });
  await assertRefused(
    f,
    r,
    before,
    /push-branch\.sh: refusing to push: could not scan the commits to send for a credential$/m,
  );
});

const WORKFLOW = /push-branch\.sh: refusing to push: the commits to send change a file under \.github\/workflows\/, which the job's token cannot push; nothing was pushed — run this task locally, where the push uses your own credential/;

async function assertWorkflowRefused(f, r, before) {
  const record = await assertRefused(f, r, before, WORKFLOW);
  assert.match(record, /\.github\/workflows\//);
  assert.doesNotMatch(record, /ci\.yml/);
  assert.match(r.stdout, /push-branch\.sh: the first such path: \.github\/workflows\/ci\.yml$/m, output(r));
}

test('job: a commit adding .github/workflows/ci.yml is refused', async (t) => {
  const f = await adoptedFixture(t);
  await f.setMarker();
  const before = await f.originTip();
  await f.commitFile('.github/workflows/ci.yml', 'on: push\n');
  await assertWorkflowRefused(f, await f.push(), before);
});

test('job: a commit deleting a workflow file is refused', async (t) => {
  const f = await adoptedFixture(t);
  await f.commitFile('.github/workflows/ci.yml', 'on: push\n');
  await assertPushed(f, await f.push());
  await f.setMarker();
  const before = await f.originTip();
  await runGit(f.dir, ['rm', '--quiet', '.github/workflows/ci.yml']);
  await runGit(f.dir, ['commit', '--quiet', '-m', 'delete the workflow']);
  await assertWorkflowRefused(f, await f.push(), before);
});

test('job: a rename of a workflow file out of the directory is refused', async (t) => {
  const f = await adoptedFixture(t);
  await f.commitFile('.github/workflows/ci.yml', 'on: push\nname: a long enough body to be a rename\n');
  await assertPushed(f, await f.push());
  await f.setMarker();
  const before = await f.originTip();
  await runGit(f.dir, ['mv', '.github/workflows/ci.yml', 'ci.yml']);
  await runGit(f.dir, ['commit', '--quiet', '-m', 'move the workflow out']);
  await assertWorkflowRefused(f, await f.push(), before);
});

test('job: the workflow commit second of two unpushed commits: the first is not pushed either', async (t) => {
  const f = await adoptedFixture(t);
  await f.setMarker();
  const before = await f.originTip();
  await f.commitFile('clean.txt', 'clean\n');
  await f.commitFile('.github/workflows/ci.yml', 'on: push\n');
  await assertWorkflowRefused(f, await f.push(), before);
  assert.equal(before, '');
});

test('job: a merge bringing a workflow edit in counts against its first parent', async (t) => {
  const f = await adoptedFixture(t);
  await assertPushed(f, await f.push());
  await runGit(f.dir, ['checkout', '--quiet', '-b', 'side']);
  await f.commitFile('.github/workflows/ci.yml', 'on: push\n');
  await runGit(f.dir, [...NO_HOOKS, 'push', '--quiet', 'origin', 'side']);
  await runGit(f.dir, ['checkout', '--quiet', BRANCH]);
  await runGit(f.dir, ['merge', '--quiet', '--no-ff', '--no-edit', 'side']);
  // Only the merge itself is sent: `side` is excluded through `--remotes=origin`.
  await runGit(f.dir, ['update-ref', '-d', `refs/remotes/origin/${BRANCH}`]);
  await f.setMarker();
  const before = await f.originTip();
  const sent = await f.git(['rev-list', BRANCH, '--not', '--remotes=origin']);
  assert.equal(sent.split('\n').length, 1);
  await assertWorkflowRefused(f, await f.push(), before);
});

test('no marker: the same workflow commit pushes, with GITHUB_ACTIONS=true or without', async (t) => {
  const f = await adoptedFixture(t);
  await f.commitFile('.github/workflows/ci.yml', 'on: push\n');
  await assertPushed(f, await f.push());
  await f.commitFile('.github/workflows/ci.yml', 'on: [push]\n', 'edit the workflow');
  await assertPushed(f, await f.push({ GITHUB_ACTIONS: 'true' }));
});

test('job: a nested workflows directory is an ordinary file and pushes', async (t) => {
  const f = await adoptedFixture(t);
  await f.setMarker();
  await f.commitFile('cli/templates/github/workflows/harness-run.yml', 'on: push\n');
  await assertPushed(f, await f.push());
});

test('job: a commit carrying both a token and a workflow file is refused with the credential reason', async (t) => {
  const f = await adoptedFixture(t);
  await f.setMarker();
  const before = await f.originTip();
  await f.commitFile('.github/workflows/ci.yml', `# ${TOKEN}\n`);
  const r = await f.push({ GH_TOKEN: TOKEN });
  const record = await assertRefused(f, r, before, CREDENTIAL('the job token', 'raw'));
  assert.match(record, /carry a credential/);
  assert.doesNotMatch(r.stdout, /first such path/);
  assertNoValue(r, TOKEN);
});
