/**
 * `doctor`'s `profile-sandbox` line, against the compiled CLI on repositories `init` wired.
 *
 * **The rule this suite enforces: a profile whose sandbox block is not what the configuration asks
 * for is reported, naming what differs — a `warn` in a default run, a `fail` under `--remote-job` —
 * and a taken opt-out is reported as a `warn` carrying its reason.** Every case is one edit to a
 * freshly wired repository, so the edit is what the line is about; case (a) is the end-to-end proof
 * that the generator and the check agree on a fresh profile. No case reaches the network.
 */

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'node:test';

import { concurrentSuite } from './helpers/concurrency.mjs';
import { createFixture, runCli } from './helpers/fixture.mjs';

const CONFIG_FILE = 'harness.config.json';
const PROFILE_FILE = '.claude/settings.autonomous.json';
const CHECK_ID = 'profile-sandbox';
const DOMAIN = { domain: 'registry.npmjs.org', reason: 'npm install fetches packages from the public registry' };
const OPT_OUT_REASON = 'the toolchain needs a socket the sandbox blocks';

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

/** Rewrite the JSON file at `relative` under `dir` through `edit`. */
function editJson(dir, relative, edit) {
  const path = join(dir, relative);
  const value = JSON.parse(readFileSync(path, 'utf8'));
  edit(value);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/** Set the config's `sandbox`, then regenerate the profile from it. */
async function configureSandbox(dir, sandbox) {
  editJson(dir, CONFIG_FILE, (config) => {
    config.sandbox = sandbox;
  });
  const init = await runCli(dir, ['init', '--force']);
  assert.equal(init.status, 0, `init --force exited ${init.status}\n${init.stdout}\n${init.stderr}`);
}

/** The `profile-sandbox` line in `status`, from the stream the reporter puts it on, or `undefined`. */
function checkLine({ stdout, stderr }, status) {
  const [stream, prefix] = { PASS: [stdout, ''], WARN: [stderr, '! '], FAIL: [stderr, '!! '] }[status];
  return stream.split('\n').find((line) => new RegExp(`^${prefix}${status}\\s+${CHECK_ID}\\s`).test(line));
}

/** Run `doctor` with `args` and return its `profile-sandbox` line in `status`, asserting there is one. */
async function doctorLine(dir, status, args = []) {
  const result = await runCli(dir, ['doctor', ...args]);
  const line = checkLine(result, status);
  assert.ok(line !== undefined, `no ${status} ${CHECK_ID} line\n${result.stdout}\n${result.stderr}`);
  return { line, status: result.status };
}

concurrentSuite('doctor profile-sandbox', () => {
  it('(a) passes on a freshly generated profile', async (t) => {
    const dir = await wiredFixture(t);
    await doctorLine(dir, 'PASS');
  });

  it('(b) warns on a profile with no sandbox key, naming the earlier release and the remedy', async (t) => {
    const dir = await wiredFixture(t);
    editJson(dir, PROFILE_FILE, (profile) => {
      delete profile.sandbox;
    });
    const { line, status } = await doctorLine(dir, 'WARN');
    assert.ok(line.includes('earlier release'), line);
    assert.ok(line.includes('init --force'), line);
    assert.equal(status, 0, line);
  });

  it('(c) warns on an extra excludedCommands entry, naming it', async (t) => {
    const dir = await wiredFixture(t);
    const extra = 'Bash(curl:*)';
    editJson(dir, PROFILE_FILE, (profile) => {
      profile.sandbox.excludedCommands.push(extra);
    });
    const { line } = await doctorLine(dir, 'WARN');
    assert.ok(line.includes(extra), line);
    assert.ok(line.includes('runs with full access'), line);
  });

  it('(d) warns on a profile missing a configured domain, naming it', async (t) => {
    const dir = await wiredFixture(t);
    await configureSandbox(dir, { allowedDomains: [DOMAIN] });
    await doctorLine(dir, 'PASS');
    editJson(dir, PROFILE_FILE, (profile) => {
      profile.sandbox.network.allowedDomains = profile.sandbox.network.allowedDomains.filter((d) => d !== DOMAIN.domain);
    });
    const { line } = await doctorLine(dir, 'WARN');
    assert.ok(line.includes(`lacks ${DOMAIN.domain}`), line);
  });

  it('(e) warns on a taken opt-out with its reason, and keeps the warn under --remote-job', async (t) => {
    const dir = await wiredFixture(t);
    await configureSandbox(dir, { optOut: { reason: OPT_OUT_REASON } });
    const { line } = await doctorLine(dir, 'WARN');
    assert.ok(line.includes(`by this repository's own choice: ${OPT_OUT_REASON}`), line);
    await doctorLine(dir, 'WARN', ['--remote-job']);
  });

  it('(f) fails case (b) under --remote-job', async (t) => {
    const dir = await wiredFixture(t);
    editJson(dir, PROFILE_FILE, (profile) => {
      delete profile.sandbox;
    });
    const { line, status } = await doctorLine(dir, 'FAIL', ['--remote-job']);
    assert.equal(status, 1, line);
  });
});
