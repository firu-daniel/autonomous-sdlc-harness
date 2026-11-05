/**
 * The written watcher's sandbox preflight in `process_inbox_file`, driven by one `tick` against a
 * fixture whose own files are committed and pushed to its `origin`, with the sourced
 * `hr_sandbox_prereq_probe_var` overridden through the helper's `sandboxProbe` option.
 *
 * **The rule these tests exist to enforce: a fresh local drop on a host with a definite missing
 * sandbox piece never launches a session — the record is `failed`, the drop is archived as
 * `failed_*` and one `failed` notification names the install fix — unless the main checkout's
 * `sandbox.optOut` carries a non-blank reason; and a drop sent to GitHub is never judged by this
 * host.**
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { runCli, runGit } from './helpers/fixture.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const INBOX = `${STATE_DIR}/autonomous_inbox`;
const ARCHIVE = `${INBOX}/.processed`;
const IDENTITY = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid'];

/** `gh`, recorded: each argument vector appended to `STUB_LOG`. */
const GH_STUB = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
appendFileSync(process.env.STUB_LOG, JSON.stringify(args) + '\\n');
if (args.join(' ').startsWith('run list')) process.stdout.write('[]');
`;

/** A probe body reporting `bwrap socat` missing, touching `marker` so a case can tell it was consulted. */
const missingProbe = (marker) =>
  [
    `: > '${marker}'`,
    'HR_SANDBOX_HOST=linux',
    'HR_SANDBOX_MISSING="bwrap socat"',
    'HR_SANDBOX_REFUSAL="The sandbox needs bwrap (package bubblewrap) and socat (package socat) on PATH; install with sudo apt-get install bubblewrap socat (Ubuntu/Debian)."',
    'return 1',
  ].join('\n');

/**
 * A watcher fixture adopted on `origin`'s default branch with `config` applied to its
 * `harness.config.json`; `regenerate` re-runs `init --force` so the base profile matches a taken
 * opt-out.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ edit?: (config: any) => void, regenerate?: boolean }} [options]
 */
async function refusalFixture(t, { edit = () => {}, regenerate = false } = {}) {
  const w = await createWatcherFixture(t);
  if (w === null) return null;

  const configPath = join(w.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  delete config.commands.depInstall;
  delete config.commands.build;
  edit(config);
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  if (regenerate) {
    const init = await runCli(w.dir, ['init', '--force', '--no-analyze']);
    assert.equal(init.status, 0, `init --force exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  }
  await writeFile(join(w.dir, '.git', 'info', 'exclude'), '/watcher-test/\n', { flag: 'a' });
  await runGit(w.dir, ['add', '-A']);
  await runGit(w.dir, [...IDENTITY, 'commit', '--quiet', '--no-verify', '-m', 'fixture: adopt the harness']);
  await runGit(w.dir, ['push', '--quiet', '--force', '--no-verify', 'origin', `HEAD:refs/heads/${config.defaultBranch}`]);

  const clone = `${w.dir}-${w.branch}`;
  t.after(() => rm(clone, { recursive: true, force: true }));
  const ghStub = join(w.dir, 'watcher-test', 'gh');
  const ghLog = join(w.dir, 'watcher-test', 'gh.log');
  await writeFile(ghStub, GH_STUB, { mode: 0o755 });
  const marker = join(w.dir, 'watcher-test', 'probe-consulted');

  return {
    ...w,
    clone,
    marker,
    missingProbe: missingProbe(marker),
    drop: () => writeFile(join(w.dir, INBOX, `${w.branch}_task_prompt.md`), 'do the thing\n', 'utf8'),
    tickWith: (sandboxProbe) =>
      sandboxProbe === undefined
        ? w.tick({ HARNESS_GH_CLI: ghStub, STUB_LOG: ghLog })
        : w.tick({ HARNESS_GH_CLI: ghStub, STUB_LOG: ghLog }, { sandboxProbe }),
    /** The inbox's drops: its `.processed/` archive and the `README.md` `init` writes are not drops. */
    inbox: () => readdirSync(join(w.dir, INBOX)).filter((name) => name !== '.processed' && name !== 'README.md'),
    archive: () => (existsSync(join(w.dir, ARCHIVE)) ? readdirSync(join(w.dir, ARCHIVE)) : []),
    workflowRuns: () =>
      existsSync(ghLog)
        ? readFileSync(ghLog, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line).join(' '))
            .filter((call) => call.startsWith('workflow run'))
        : [],
  };
}

/** The refusal (a): no launch, `failed`, one `failed_*` archive, one `failed` notice naming the fix. */
function assertRefused(f) {
  assert.deepEqual(f.prompts(), [], `the stub was launched:\n${f.watcherLog()}`);
  assert.equal(f.record().status, 'failed');
  assert.deepEqual(f.inbox(), []);
  const archived = f.archive();
  assert.equal(archived.length, 1, JSON.stringify(archived));
  assert.match(archived[0], /^failed_\d+_feat_x_task_prompt\.md$/);
  const failed = f.notifications().filter((n) => n.event === 'failed');
  assert.equal(failed.length, 1, JSON.stringify(f.notifications()));
  assert.match(failed[0].detail, /bubblewrap/);
  assert.ok(f.watcherLog().includes('not launching'), `no "not launching" line:\n${f.watcherLog()}`);
  assert.equal(existsSync(f.clone), false, 'a working copy was created');
}

test('(a) a definite missing piece refuses the drop before any working copy, and archives it as failed', async (t) => {
  const f = await refusalFixture(t);
  if (f === null) return;

  await f.drop();
  await f.tickWith(f.missingProbe);
  assertRefused(f);
});

test('(b) a taken sandbox.optOut exempts the drop: the stub is launched', async (t) => {
  const f = await refusalFixture(t, {
    edit: (config) => {
      config.sandbox = { ...(config.sandbox ?? {}), optOut: { reason: 'r' } };
    },
    regenerate: true,
  });
  if (f === null) return;

  await f.drop();
  await f.tickWith(f.missingProbe);
  assert.equal(f.prompts().length, 1, `the stub was not launched:\n${f.watcherLog()}`);
  assert.equal(f.watcherLog().includes('not launching'), false, f.watcherLog());
});

test('(c) a blank optOut reason is not a taken opt-out: refused as in (a)', async (t) => {
  const f = await refusalFixture(t, {
    edit: (config) => {
      config.sandbox = { ...(config.sandbox ?? {}), optOut: { reason: '   ' } };
    },
  });
  if (f === null) return;

  await f.drop();
  await f.tickWith(f.missingProbe);
  assertRefused(f);
});

test('(d) the helper\'s default probe launches the stub', async (t) => {
  const f = await refusalFixture(t);
  if (f === null) return;

  await f.drop();
  await f.tickWith();
  assert.equal(f.prompts().length, 1, `the stub was not launched:\n${f.watcherLog()}`);
  assert.equal(f.record().status, 'completed');
});

test('(e) a drop sent to GitHub Actions never consults the probe and is dispatched', async (t) => {
  const f = await refusalFixture(t, {
    edit: (config) => {
      config.execution = { target: 'github-actions' };
    },
  });
  if (f === null) return;

  await f.drop();
  await f.tickWith(f.missingProbe);
  assert.equal(existsSync(f.marker), false, 'the probe was consulted for a remote drop');
  assert.equal(f.workflowRuns().length, 1, `no dispatch:\n${f.watcherLog()}`);
  assert.deepEqual(f.prompts(), [], 'the agent stub was launched');
  assert.equal(f.record().status, 'running');
});
