/**
 * `doctor`'s `profile-main-anchor` line, against the compiled CLI on repositories `init` wired.
 *
 * **The rule this suite enforces: a profile whose `permissions.allow` lacks the anchor read's rule,
 * or whose `ask` or `deny` list carries it, is reported as a `warn` printing the rule — never a
 * `fail`, `--remote-job` included — and a profile that cannot be read leaves the line unevaluated.**
 * Every case is one edit to a freshly wired repository; case (a) is the end-to-end proof that the
 * generator and the check agree on a fresh profile. No case reaches the network.
 */

import assert from 'node:assert/strict';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'node:test';

import { MAIN_REPO_ANCHOR_RULE } from '../dist/core/mainRepoAnchor.js';
import { concurrentSuite } from './helpers/concurrency.mjs';
import { createFixture, runCli } from './helpers/fixture.mjs';

const PROFILE_FILE = '.claude/settings.autonomous.json';
const CHECK_ID = 'profile-main-anchor';

/** A repository whose stack detection resolves every command, so `init` writes a config `doctor` passes. */
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

/** A repository `init` wired, torn down after `t`. */
async function wiredFixture(t) {
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);
  const init = await runCli(fixture.dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  return fixture.dir;
}

/** Rewrite the generated profile under `dir` through `edit`. */
function editProfile(dir, edit) {
  const path = join(dir, PROFILE_FILE);
  const value = JSON.parse(readFileSync(path, 'utf8'));
  edit(value);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/** Remove the anchor rule from the profile's allow list, asserting it was there. */
function dropAnchorRule(dir) {
  editProfile(dir, (profile) => {
    assert.ok(profile.permissions.allow.includes(MAIN_REPO_ANCHOR_RULE), `no ${MAIN_REPO_ANCHOR_RULE} in allow`);
    profile.permissions.allow = profile.permissions.allow.filter((entry) => entry !== MAIN_REPO_ANCHOR_RULE);
  });
}

/** The `id` line in `status`, from the stream the reporter puts it on, or `undefined`. */
function checkLine({ stdout, stderr }, status, id) {
  const [stream, prefix] = { PASS: [stdout, ''], WARN: [stderr, '! '], FAIL: [stderr, '!! '] }[status];
  return stream.split('\n').find((line) => new RegExp(`^${prefix}${status}\\s+${id}\\s`).test(line));
}

/** Run `doctor` with `args`; return its `CHECK_ID` line in `status`, asserting there is one, and the whole result. */
async function doctorLine(dir, status, args = []) {
  const result = await runCli(dir, ['doctor', ...args]);
  const line = checkLine(result, status, CHECK_ID);
  assert.ok(line !== undefined, `no ${status} ${CHECK_ID} line\n${result.stdout}\n${result.stderr}`);
  return { line, result };
}

concurrentSuite('doctor profile-main-anchor', () => {
  it('(a) passes on a freshly generated profile', async (t) => {
    const dir = await wiredFixture(t);
    await doctorLine(dir, 'PASS');
  });

  it('(b) warns when the rule is missing from allow, printing it on its own line, and exits 0', async (t) => {
    const dir = await wiredFixture(t);
    dropAnchorRule(dir);
    const { line, result } = await doctorLine(dir, 'WARN');
    assert.ok(line.includes('missing from its allow list'), line);
    assert.ok(line.includes('init --force'), line);
    assert.ok(result.stderr.split('\n').includes(MAIN_REPO_ANCHOR_RULE), result.stderr);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  });

  it('(c) warns when the rule is also in ask, naming ask', async (t) => {
    const dir = await wiredFixture(t);
    editProfile(dir, (profile) => {
      profile.permissions.ask = [...(profile.permissions.ask ?? []), MAIN_REPO_ANCHOR_RULE];
    });
    const { line } = await doctorLine(dir, 'WARN');
    assert.ok(line.includes('ask list'), line);
    assert.ok(!line.includes('missing from its allow list'), line);
  });

  it('(d) keeps case (b) a warn under --remote-job, never a fail', async (t) => {
    const dir = await wiredFixture(t);
    dropAnchorRule(dir);
    const { result } = await doctorLine(dir, 'WARN', ['--remote-job']);
    assert.equal(checkLine(result, 'FAIL', CHECK_ID), undefined, result.stderr);
  });

  it('(e) is unevaluated when the profile is deleted', async (t) => {
    const dir = await wiredFixture(t);
    rmSync(join(dir, PROFILE_FILE));
    const { line } = await doctorLine(dir, 'FAIL');
    assert.ok(line.includes('not evaluated'), line);
    assert.ok(line.includes('permission-profile check'), line);
  });
});
