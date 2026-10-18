/**
 * `doctor`'s `profile-sandbox` and `profile-write-protection` lines, against the compiled CLI on
 * repositories `init` wired.
 *
 * **The rules this suite enforces: a profile whose sandbox block is not what the configuration asks
 * for is reported, naming what differs — a `warn` in a default run, a `fail` under `--remote-job` —
 * an excluded entry in an earlier release's `Bash(…)` spelling is named as stale under the same
 * grades rather than as an unnamed extra, and a taken opt-out is reported as a `warn` carrying its reason; and a path that runs outside the
 * sandbox but lacks its `denyWrite` entry or a file-tool deny rule is reported by path and side, with
 * the same grades, `denyWrite` going ungraded under a taken opt-out.** Every case is one edit to a
 * freshly wired repository, so the edit is what the line is about; each suite's case (a) is the
 * end-to-end proof that the generator and the check agree on a fresh profile. No case reaches the
 * network.
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
const WRITE_CHECK_ID = 'profile-write-protection';
const PUSH_SCRIPT = 'push-branch.sh';
const DOCS_SERVER_SCRIPT = 'docs-search-server.sh';
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

/** The `id` line in `status`, from the stream the reporter puts it on, or `undefined`. */
function checkLine({ stdout, stderr }, status, id) {
  const [stream, prefix] = { PASS: [stdout, ''], WARN: [stderr, '! '], FAIL: [stderr, '!! '] }[status];
  return stream.split('\n').find((line) => new RegExp(`^${prefix}${status}\\s+${id}\\s`).test(line));
}

/** Run `doctor` with `args` and return its `id` line in `status`, asserting there is one. */
async function doctorLine(dir, status, args = [], id = CHECK_ID) {
  const result = await runCli(dir, ['doctor', ...args]);
  const line = checkLine(result, status, id);
  assert.ok(line !== undefined, `no ${status} ${id} line\n${result.stdout}\n${result.stderr}`);
  return { line, status: result.status };
}

/** The main checkout's `denyWrite` entry ending in `/<file>`, read from the generated profile. */
function mainCheckoutEntry(dir, file) {
  const profile = JSON.parse(readFileSync(join(dir, PROFILE_FILE), 'utf8'));
  const entry = profile.sandbox.filesystem.denyWrite.find((path) => path.endsWith(`/${file}`) && !path.includes('*'));
  assert.ok(entry !== undefined, `no main-checkout denyWrite entry for ${file}`);
  return entry;
}

/** Delete `path`'s `denyWrite` entry from the profile. */
function dropDenyWrite(dir, path) {
  editJson(dir, PROFILE_FILE, (profile) => {
    profile.sandbox.filesystem.denyWrite = profile.sandbox.filesystem.denyWrite.filter((entry) => entry !== path);
  });
}

/** Rewrite each `sandbox.excludedCommands` entry `e` as `Bash(e)`, returning the rewritten entries. */
function staleExcludedSpelling(dir) {
  let stale = [];
  editJson(dir, PROFILE_FILE, (profile) => {
    stale = profile.sandbox.excludedCommands.map((entry) => `Bash(${entry})`);
    profile.sandbox.excludedCommands = stale;
  });
  return stale;
}

/** Delete `path`'s `Edit` deny rule from the profile, returning the rule. */
function dropEditRule(dir, path) {
  const rule = `Edit(/${path})`;
  editJson(dir, PROFILE_FILE, (profile) => {
    assert.ok(profile.permissions.deny.includes(rule), `no ${rule} in the profile's deny list`);
    profile.permissions.deny = profile.permissions.deny.filter((entry) => entry !== rule);
  });
  return rule;
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

  it("(g) warns on the earlier release's Bash(…) excluded spelling, naming it as stale", async (t) => {
    const dir = await wiredFixture(t);
    const stale = staleExcludedSpelling(dir);
    const push = stale.find((entry) => entry.includes(`/${PUSH_SCRIPT}`));
    assert.ok(push !== undefined, `no stale entry for ${PUSH_SCRIPT}`);
    const { line, status } = await doctorLine(dir, 'WARN');
    assert.ok(line.includes(push), line);
    assert.ok(line.includes('matches no command'), line);
    assert.ok(line.includes('init --force'), line);
    assert.ok(!line.includes('runs with full access'), line);
    assert.ok(!line.includes('excludedCommands` lacks'), line);
    assert.equal(status, 0, line);
  });

  it('(h) fails case (g) under --remote-job', async (t) => {
    const dir = await wiredFixture(t);
    staleExcludedSpelling(dir);
    const { line, status } = await doctorLine(dir, 'FAIL', ['--remote-job']);
    assert.equal(status, 1, line);
  });
});

concurrentSuite('doctor profile-write-protection', () => {
  it('(a) passes on a freshly generated profile, stating the Linux residual', async (t) => {
    const dir = await wiredFixture(t);
    const { line } = await doctorLine(dir, 'PASS', [], WRITE_CHECK_ID);
    assert.ok(line.includes('How the Linux sandbox treats') && line.includes('is unverified'), line);
  });

  it("(b) warns when the main checkout's push wrapper has no denyWrite entry, naming the path and the side", async (t) => {
    const dir = await wiredFixture(t);
    const path = mainCheckoutEntry(dir, PUSH_SCRIPT);
    dropDenyWrite(dir, path);
    const { line, status } = await doctorLine(dir, 'WARN', [], WRITE_CHECK_ID);
    assert.ok(line.includes(`${path} (`), line);
    assert.ok(line.includes('has no sandbox.filesystem.denyWrite entry'), line);
    assert.ok(line.includes('init --force'), line);
    assert.equal(status, 0, line);
  });

  it('(c) warns when its Edit rule is missing, naming the file-tool side', async (t) => {
    const dir = await wiredFixture(t);
    const path = mainCheckoutEntry(dir, PUSH_SCRIPT);
    const rule = dropEditRule(dir, path);
    const { line } = await doctorLine(dir, 'WARN', [], WRITE_CHECK_ID);
    assert.ok(line.includes(`${path} (`), line);
    assert.ok(line.includes(`lacks the file-tool deny rule ${rule}`), line);
  });

  it('(d) warns when docs retrieval is on and the docs-search-server entry is gone', async (t) => {
    const dir = await wiredFixture(t);
    editJson(dir, CONFIG_FILE, (config) => {
      config.phases = { ...config.phases, docs: true };
      config.docs = { ...config.docs, retrieval: true };
    });
    const init = await runCli(dir, ['init', '--force']);
    assert.equal(init.status, 0, `init --force exited ${init.status}\n${init.stdout}\n${init.stderr}`);
    await doctorLine(dir, 'PASS', [], WRITE_CHECK_ID);
    const path = mainCheckoutEntry(dir, DOCS_SERVER_SCRIPT);
    dropDenyWrite(dir, path);
    const { line } = await doctorLine(dir, 'WARN', [], WRITE_CHECK_ID);
    assert.ok(line.includes(`${path} (`), line);
  });

  it('(e) fails case (b) under --remote-job', async (t) => {
    const dir = await wiredFixture(t);
    dropDenyWrite(dir, mainCheckoutEntry(dir, PUSH_SCRIPT));
    const { line, status } = await doctorLine(dir, 'FAIL', ['--remote-job'], WRITE_CHECK_ID);
    assert.equal(status, 1, line);
  });

  it('(f) under sandbox.optOut, grades only the file-tool rules', async (t) => {
    const dir = await wiredFixture(t);
    await configureSandbox(dir, { optOut: { reason: OPT_OUT_REASON } });
    const path = mainCheckoutEntry(dir, PUSH_SCRIPT);
    dropDenyWrite(dir, path);
    const passed = await doctorLine(dir, 'PASS', [], WRITE_CHECK_ID);
    assert.ok(passed.line.includes('not graded because the sandbox is off'), passed.line);
    const rule = dropEditRule(dir, path);
    const { line } = await doctorLine(dir, 'WARN', [], WRITE_CHECK_ID);
    assert.ok(line.includes(rule), line);
    assert.ok(line.includes('not graded because the sandbox is off'), line);
  });

  it("(g) warns when the scripts directory's .git entry lacks its under-it rule, naming that rule", async (t) => {
    const dir = await wiredFixture(t);
    const profile = JSON.parse(readFileSync(join(dir, PROFILE_FILE), 'utf8'));
    const config = JSON.parse(readFileSync(join(dir, CONFIG_FILE), 'utf8'));
    const path = join(dir, config.scriptsDir, '.git');
    assert.ok(profile.sandbox.filesystem.denyWrite.includes(path), `no denyWrite entry for ${path}`);
    const rule = `Edit(/${path}/**)`;
    editJson(dir, PROFILE_FILE, (value) => {
      assert.ok(value.permissions.deny.includes(rule), `no ${rule} in the profile's deny list`);
      value.permissions.deny = value.permissions.deny.filter((entry) => entry !== rule);
    });
    const { line, status } = await doctorLine(dir, 'WARN', [], WRITE_CHECK_ID);
    assert.ok(line.includes(`${path} (`), line);
    assert.ok(line.includes(`lacks the file-tool deny rule ${rule}`), line);
    assert.equal(status, 0, line);
  });
});
