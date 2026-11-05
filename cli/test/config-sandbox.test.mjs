/**
 * The `sandbox` key's structural check, through `doctor`'s `config` line, against the compiled CLI.
 *
 * **The rule this suite exists to enforce: every allowed domain is a bare host that states its
 * reason, and the opt-out is a reasoned object, never a bare switch or a blank reason.** An
 * unexplained domain is a network grant nobody can audit, and an opt-out with no reason turns the
 * sandbox off without saying why — so each is an error naming the dotted key an adopter edits.
 *
 * One fixture serves every case: `doctor` repairs nothing, so the cases rewrite `sandbox` in turn and
 * run in order. `doctor` runs without `--check-github`, so no case reaches the network.
 */

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, runCli } from './helpers/fixture.mjs';

const CONFIG_FILE = 'harness.config.json';

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

/** Replace the config's `sandbox` with `sandbox`, or remove it when `sandbox` is `undefined`. */
function setSandbox(path, base, sandbox) {
  const config = { ...base };
  if (sandbox === undefined) delete config.sandbox;
  else config.sandbox = sandbox;
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

/** The `config` check's FAIL line, as the reporter emits it on stderr, or `undefined`. */
function configFailLine(stderr) {
  return stderr.split('\n').find((line) => /^!! FAIL\s+config\s/.test(line));
}

const DOMAIN = { domain: 'registry.npmjs.org', reason: 'npm install fetches packages from the public registry' };

test('doctor grades the sandbox key on its config line', async (t) => {
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);
  const init = await runCli(fixture.dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);

  const configPath = join(fixture.dir, CONFIG_FILE);
  const base = JSON.parse(readFileSync(configPath, 'utf8'));

  const passing = [
    ['a valid sandbox with one domain and its reason', { allowedDomains: [DOMAIN] }],
    ['an IPv4 literal as a domain', { allowedDomains: [{ domain: '10.0.0.1', reason: 'the internal mirror' }] }],
    ['a taken opt-out', { optOut: { reason: 'the toolchain needs a socket the sandbox blocks' } }],
    ['an absent sandbox', undefined],
  ];
  for (const [name, sandbox] of passing) {
    await t.test(`${name} passes`, async () => {
      setSandbox(configPath, base, sandbox);
      const { stdout, stderr } = await runCli(fixture.dir, ['doctor']);
      assert.match(stdout, /^PASS\s+config\s/m, `config did not pass\n${stdout}\n${stderr}`);
    });
  }

  const failing = [
    ['an entry missing reason', { allowedDomains: [{ domain: 'registry.npmjs.org' }] }, 'sandbox.allowedDomains[0].reason: is required'],
    ['an empty reason', { allowedDomains: [{ domain: 'registry.npmjs.org', reason: '' }] }, 'sandbox.allowedDomains[0].reason: must not be blank'],
    ['a domain carrying a scheme', { allowedDomains: [{ ...DOMAIN, domain: 'https://registry.npmjs.org' }] }, 'sandbox.allowedDomains[0].domain: "https://registry.npmjs.org" is not a bare hostname'],
    ['a domain carrying a port', { allowedDomains: [{ ...DOMAIN, domain: 'registry.npmjs.org:443' }] }, 'sandbox.allowedDomains[0].domain: "registry.npmjs.org:443" is not a bare hostname'],
    ['a wildcard domain', { allowedDomains: [{ ...DOMAIN, domain: '*.npmjs.org' }] }, 'sandbox.allowedDomains[0].domain: "*.npmjs.org" is not a bare hostname'],
    ['an unknown key inside an entry', { allowedDomains: [{ ...DOMAIN, port: 443 }] }, 'sandbox.allowedDomains[0].port: unknown key'],
    ['allowedDomains that is not an array', { allowedDomains: 'registry.npmjs.org' }, 'sandbox.allowedDomains: must be an array of objects'],
    ['an unknown key in the section', { allowDomains: [DOMAIN] }, 'sandbox.allowDomains: unknown key'],
    ['optOut: true instead of an object', { optOut: true }, 'sandbox.optOut: must be an object, not a boolean'],
    ['optOut without reason', { optOut: {} }, 'sandbox.optOut.reason: is required'],
    // A blank reason is not a taken opt-out (`sandboxOptedOut` answers false), so it must not pass as one.
    ['optOut with a blank reason', { optOut: { reason: '  ' } }, 'sandbox.optOut.reason: must not be blank'],
  ];
  for (const [name, sandbox, expected] of failing) {
    await t.test(`${name} is an error naming the key`, async () => {
      setSandbox(configPath, base, sandbox);
      const { status, stdout, stderr } = await runCli(fixture.dir, ['doctor']);
      assert.equal(status, 1, `doctor exited ${status}\n${stdout}\n${stderr}`);
      const line = configFailLine(stderr);
      assert.ok(line !== undefined, `no config FAIL line\n${stderr}`);
      assert.ok(line.includes(expected), `config FAIL line does not carry ${JSON.stringify(expected)}\n${line}`);
    });
  }
});
