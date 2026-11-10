/**
 * `doctor`'s `branch-protection` check, driven through the compiled CLI against a stubbed `gh`.
 *
 * **The rule these cases enforce: GitHub is asked only under `--check-github` and only with
 * `forge: github`, every call is a read, a pass is only a proven pass, cannot-tell is never graded as
 * missing, and the check never fails.**
 *
 * `HARNESS_GH_CLI` points at a file-local stub that logs its argv and answers from per-argv
 * `out` / `err` / `status` / `kill` files, in the manner of `doctor.test.mjs` → `answeringGhStub`; a
 * `kill` file makes the stub signal itself, which hands the check the `null` status a timed-out call
 * gives. Every case asserts its whole call log carries no write flag, prints no `FAIL` line for this
 * check and exits 0.
 *
 * **Not covered:** a real GitHub, and ruleset bypass actors (the per-branch rules endpoint does not
 * report them; `cli/src/doctor/branchProtection.ts`'s header).
 *
 * Runs against `dist/`, so `npm run build` precedes `npm test`.
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { describe } from 'node:test';

import { CASE_CONCURRENCY } from './helpers/concurrency.mjs';
import { createFixture, readJson, runCli } from './helpers/fixture.mjs';

import { branchRulesEndpoint, classicProtectionEndpoint } from '../dist/doctor/branchProtection.js';

const CHECK_ID = 'branch-protection';
const GH_CLI_VARIABLE = 'HARNESS_GH_CLI';
const FIXTURE_GH_CLI = 'harness-fixture-gh';
const CONFIG_FILE = 'harness.config.json';

/** Any of these on a logged argv would make a `gh api` call something other than a GET. */
const WRITE_FLAGS = Object.freeze(['--method', '-X', '-f', '-F', '--field', '--raw-field', '--input']);

const AUTH_OK = { out: 'Logged in to github.com\n' };
const RULES_ALL = { out: JSON.stringify([{ type: 'pull_request' }, { type: 'non_fast_forward' }, { type: 'deletion' }]) };
const RULES_NONE = { out: '[]' };
const CLASSIC_ALL = {
  out: JSON.stringify({
    required_pull_request_reviews: { required_approving_review_count: 1 },
    allow_force_pushes: { enabled: false },
    allow_deletions: { enabled: false },
    enforce_admins: { enabled: true },
  }),
};
const CLASSIC_NONE = { err: 'gh: Branch not protected (HTTP 404)\n', status: 1 };
const MISSING = 'no ruleset or branch protection blocks';

/** A repository `init` has wired, with no forge set; its own `origin` keeps every other check green. */
async function wiredFixture(t) {
  const fixture = await createFixture({
    files: {
      'package.json': {
        name: 'fixture-project',
        private: true,
        version: '0.0.0',
        scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
      },
      'README.md': '# fixture project\n',
    },
  });
  t.after(fixture.cleanup);
  const result = await runCli(fixture.dir, ['init']);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return fixture.dir;
}

/** `config set` each edit in order, asserting each exits 0. */
async function configure(dir, edits) {
  for (const [key, value] of edits) {
    const result = await runCli(dir, ['config', 'set', key, value]);
    assert.equal(result.status, 0, `config set ${key} exited ${result.status}\n${result.stderr}`);
  }
}

/**
 * A wired fixture with `forge: github` and its default branch, which follows the host's git default.
 * `also`, when given, names the protected entries listed after that branch.
 */
async function githubFixture(t, also = []) {
  const dir = await wiredFixture(t);
  const branch = readJson(join(dir, CONFIG_FILE)).defaultBranch;
  const edits = [['forge', 'github']];
  if (also.length > 0) edits.push(['protectedBranches', JSON.stringify([branch, ...also])]);
  await configure(dir, edits);
  return { dir, branch };
}

/** A `gh` stub that logs its argv and answers from `<answers>/<argv, spaces and commas as _>.{out,err,status,kill}`. */
async function answeringGhStub(t) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-gh-protection-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const log = join(dir, 'invocations.log');
  const answers = join(dir, 'answers');
  mkdirSync(answers);
  const path = join(dir, FIXTURE_GH_CLI);
  writeFileSync(
    path,
    [
      '#!/bin/sh',
      `printf '%s\\n' "$*" >> ${JSON.stringify(log)}`,
      `a=${JSON.stringify(answers)}/$(printf '%s' "$*" | tr ' ,' '__')`,
      '[ -f "$a.kill" ] && kill -TERM $$',
      '[ -f "$a.out" ] && cat "$a.out"',
      '[ -f "$a.err" ] && cat "$a.err" >&2',
      '[ -f "$a.status" ] && exit "$(cat "$a.status")"',
      'exit 0',
      '',
    ].join('\n'),
    { mode: 0o755 },
  );
  return { dir, path, log, answers };
}

/** Write one answer — `{ out?, err?, status?, kill? }` — for the argv `args`. */
function answer(stub, args, fields) {
  const stem = join(stub.answers, args.join(' ').replace(/[ ,]/g, '_'));
  // An `api` path's slashes make the stem a nested path under the answers directory.
  mkdirSync(dirname(stem), { recursive: true });
  for (const [field, value] of Object.entries(fields)) writeFileSync(`${stem}.${field}`, field === 'kill' ? '' : String(value));
}

const AUTH = ['auth', 'status'];
const rulesCall = (branch) => ['api', branchRulesEndpoint(branch)];
const classicCall = (branch) => ['api', classicProtectionEndpoint(branch)];

/** The stub's logged invocations, one argv string each; empty when it was never run. */
function ghInvocations(stub) {
  return existsSync(stub.log) ? readFileSync(stub.log, 'utf8').split('\n').filter((line) => line !== '') : [];
}

/** Run `doctor` with `args` against the stub (or `gh` in its place), then hold the never-fails, read-only bar. */
async function doctor(dir, stub, args, gh = stub.path) {
  const result = await runCli(dir, ['doctor', ...args], { [GH_CLI_VARIABLE]: gh });
  const output = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, `doctor exited ${result.status}\n${output}`);
  assert.doesNotMatch(output, new RegExp(`^!! FAIL\\s+${CHECK_ID}\\s`, 'm'), output);
  for (const call of ghInvocations(stub)) {
    const flags = call.split(' ').filter((word) => WRITE_FLAGS.includes(word));
    assert.deepEqual(flags, [], `gh was called with a write flag: ${call}`);
  }
  return { ...result, output };
}

/** The check's report line at `status` (`pass` on stdout, `warn` on stderr), whole. */
function line(result, status) {
  const [stream, prefix] = status === 'pass' ? [result.stdout, 'PASS  '] : [result.stderr, '! WARN  '];
  const found = stream.split('\n').find((text) => text.startsWith(`${prefix}${CHECK_ID}`));
  assert.ok(found, `no ${status} line for ${CHECK_ID}\n${result.output}`);
  return found;
}

/** Whether any logged call reads a branch's rules or protection. */
function askedAboutBranches(stub) {
  return ghInvocations(stub).some((call) => call.includes('/rules/branches/') || call.endsWith('/protection'));
}

describe('doctor branch-protection', { concurrency: CASE_CONCURRENCY }, () => {
  test('a default run with forge github asks nothing and says how to ask', async (t) => {
    const { dir } = await githubFixture(t);
    const stub = await answeringGhStub(t);

    const result = await doctor(dir, stub, []);

    const warn = line(result, 'warn');
    assert.ok(warn.includes('not checked'), warn);
    assert.ok(warn.includes('doctor --check-github'), warn);
    assert.deepEqual(ghInvocations(stub), [], 'a default doctor run invoked gh');
  });

  for (const [name, edits, state] of [
    ['none', [['forge', 'none']], 'forge is "none"'],
    ['unset', [], 'forge is not set'],
  ]) {
    test(`--check-github with forge ${name} warns naming it and reads no branch`, async (t) => {
      const dir = await wiredFixture(t);
      await configure(dir, edits);
      const stub = await answeringGhStub(t);
      answer(stub, AUTH, AUTH_OK);

      const result = await doctor(dir, stub, ['--check-github']);

      assert.ok(line(result, 'warn').includes(state), result.output);
      assert.equal(askedAboutBranches(stub), false, ghInvocations(stub).join('\n'));
    });
  }

  test('doctor --help names branch-protection in the --check-github text', async (t) => {
    const dir = await wiredFixture(t);
    const { status, stdout, stderr } = await runCli(dir, ['doctor', '--help']);
    assert.equal(status, 0, stderr);
    const option = (stdout + stderr).match(/--check-github\s+Ask GitHub[\s\S]*?\n\s+--/);
    assert.ok(option, stdout + stderr);
    assert.ok(option[0].includes('branch-protection'), option[0]);
  });

  test('a ruleset blocking all three passes without asking for classic protection', async (t) => {
    const { dir, branch } = await githubFixture(t);
    const stub = await answeringGhStub(t);
    answer(stub, AUTH, AUTH_OK);
    answer(stub, rulesCall(branch), RULES_ALL);

    const result = await doctor(dir, stub, ['--check-github']);

    assert.ok(line(result, 'pass').includes(`\`${branch}\``), result.output);
    assert.deepEqual(ghInvocations(stub), [AUTH, rulesCall(branch)].map((args) => args.join(' ')));
  });

  test('classic protection blocking all three passes when no ruleset applies', async (t) => {
    const { dir, branch } = await githubFixture(t);
    const stub = await answeringGhStub(t);
    answer(stub, AUTH, AUTH_OK);
    answer(stub, rulesCall(branch), RULES_NONE);
    answer(stub, classicCall(branch), CLASSIC_ALL);

    const result = await doctor(dir, stub, ['--check-github']);

    assert.ok(line(result, 'pass').includes(`\`${branch}\``), result.output);
    assert.deepEqual(ghInvocations(stub), [AUTH, rulesCall(branch), classicCall(branch)].map((args) => args.join(' ')));
  });

  test('no ruleset and no classic protection warns naming the branch and all three needs', async (t) => {
    const { dir, branch } = await githubFixture(t);
    const stub = await answeringGhStub(t);
    answer(stub, AUTH, AUTH_OK);
    answer(stub, rulesCall(branch), RULES_NONE);
    answer(stub, classicCall(branch), CLASSIC_NONE);

    const warn = line(await doctor(dir, stub, ['--check-github']), 'warn');

    assert.ok(warn.includes(`\`${branch}\`: ${MISSING} direct pushes, force pushes and deletion`), warn);
    assert.ok(!warn.includes('cannot tell'), warn);
  });

  test('a ruleset blocking only deletion warns naming the other two, not deletion', async (t) => {
    const { dir, branch } = await githubFixture(t);
    const stub = await answeringGhStub(t);
    answer(stub, AUTH, AUTH_OK);
    answer(stub, rulesCall(branch), { out: JSON.stringify([{ type: 'deletion' }]) });
    answer(stub, classicCall(branch), CLASSIC_NONE);

    const warn = line(await doctor(dir, stub, ['--check-github']), 'warn');

    const clause = warn.split('; ').find((part) => part.includes(`\`${branch}\`: ${MISSING}`));
    assert.ok(clause?.endsWith(`\`${branch}\`: ${MISSING} direct pushes and force pushes`), warn);
  });

  test('refused rules and refused classic reads warn cannot tell, never missing', async (t) => {
    const { dir, branch } = await githubFixture(t);
    const stub = await answeringGhStub(t);
    answer(stub, AUTH, AUTH_OK);
    answer(stub, rulesCall(branch), { err: 'gh: Resource not accessible by integration (HTTP 403)\n', status: 1 });
    answer(stub, classicCall(branch), { err: 'gh: Not Found (HTTP 404)\n', status: 1 });

    const warn = line(await doctor(dir, stub, ['--check-github']), 'warn');

    assert.ok(warn.includes(`\`${branch}\`: cannot tell whether direct pushes, force pushes and deletion are blocked`), warn);
    assert.ok(!warn.includes(MISSING), warn);
    assert.ok(warn.includes('admin access'), warn);
  });

  test('with two protected branches only the uncovered one is named as lacking protection', async (t) => {
    const { dir, branch } = await githubFixture(t, ['develop']);
    const stub = await answeringGhStub(t);
    answer(stub, AUTH, AUTH_OK);
    answer(stub, rulesCall(branch), RULES_ALL);
    answer(stub, rulesCall('develop'), RULES_NONE);
    answer(stub, classicCall('develop'), CLASSIC_NONE);

    const warn = line(await doctor(dir, stub, ['--check-github']), 'warn');

    assert.ok(warn.includes(`\`develop\`: ${MISSING}`), warn);
    assert.ok(!warn.includes(`\`${branch}\`: ${MISSING}`), warn);
    assert.ok(warn.includes(`covered: \`${branch}\``), warn);
  });

  test('a gh that does not spawn warns with the install remedy', async (t) => {
    const { dir } = await githubFixture(t);
    const stub = await answeringGhStub(t);

    const result = await doctor(dir, stub, ['--check-github'], join(stub.dir, `${FIXTURE_GH_CLI}-absent`));

    assert.ok(line(result, 'warn').includes('install the GitHub CLI'), result.output);
  });

  test('a refused gh auth status warns naming gh auth login and reads no branch', async (t) => {
    const { dir } = await githubFixture(t);
    const stub = await answeringGhStub(t);
    answer(stub, AUTH, { err: 'You are not logged into any GitHub hosts.\n', status: 1 });

    const result = await doctor(dir, stub, ['--check-github']);

    assert.ok(line(result, 'warn').includes('gh auth login'), result.output);
    assert.equal(askedAboutBranches(stub), false, ghInvocations(stub).join('\n'));
  });

  test('a timed-out rules read warns cannot tell', async (t) => {
    const { dir, branch } = await githubFixture(t);
    const stub = await answeringGhStub(t);
    answer(stub, AUTH, AUTH_OK);
    answer(stub, rulesCall(branch), { kill: true });
    answer(stub, classicCall(branch), CLASSIC_NONE);

    const warn = line(await doctor(dir, stub, ['--check-github']), 'warn');

    assert.ok(warn.includes(`\`${branch}\`: cannot tell`), warn);
    assert.ok(warn.includes('timed out'), warn);
    assert.ok(!warn.includes(MISSING), warn);
  });

  test('a timed-out classic read warns cannot tell without blaming admin access', async (t) => {
    const { dir, branch } = await githubFixture(t);
    const stub = await answeringGhStub(t);
    answer(stub, AUTH, AUTH_OK);
    answer(stub, rulesCall(branch), RULES_NONE);
    answer(stub, classicCall(branch), { kill: true });

    const warn = line(await doctor(dir, stub, ['--check-github']), 'warn');

    assert.ok(warn.includes(`\`${branch}\`: cannot tell`), warn);
    assert.ok(warn.includes('timed out'), warn);
    assert.ok(!warn.includes('admin access'), warn);
  });

  test('a rules answer that is not JSON warns naming its shape', async (t) => {
    const { dir, branch } = await githubFixture(t);
    const stub = await answeringGhStub(t);
    answer(stub, AUTH, AUTH_OK);
    answer(stub, rulesCall(branch), { out: 'not json\n' });
    answer(stub, classicCall(branch), CLASSIC_NONE);

    const warn = line(await doctor(dir, stub, ['--check-github']), 'warn');

    assert.ok(warn.includes('shape'), warn);
    assert.ok(warn.includes('cannot tell'), warn);
  });

  test('a glob entry warns as not checked while the concrete branch is still read', async (t) => {
    const { dir, branch } = await githubFixture(t, ['release/*']);
    const stub = await answeringGhStub(t);
    answer(stub, AUTH, AUTH_OK);
    answer(stub, rulesCall(branch), RULES_ALL);

    const warn = line(await doctor(dir, stub, ['--check-github']), 'warn');

    assert.ok(warn.includes('`release/*` names a namespace rather than one branch'), warn);
    assert.ok(warn.includes(`covered: \`${branch}\``), warn);
    assert.deepEqual(ghInvocations(stub), [AUTH, rulesCall(branch)].map((args) => args.join(' ')));
  });
});
