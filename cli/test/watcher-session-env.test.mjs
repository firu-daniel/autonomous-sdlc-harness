/**
 * The environment the written watcher launches an engine session with — `spawn_engine`'s
 * precomputed `session_unset_names` and the `unset` in the launch pipe's head, in
 * `autonomous-watcher.sh` — read by an agent stub that records the names it was handed.
 *
 * **The rule this suite enforces: the launch line strips the tokens.** In both modes the session
 * starts without the profile's `sandbox.credentials.envVars` names (bar the agent's own two
 * credentials) and without the watcher-owned `SESSION_ENV_STRIP_EXTRA`, while the watcher keeps them
 * for its own passes; a local session also starts without every name outside `SESSION_ENV_BASE` and
 * the main checkout's `sandbox.passEnv`, and the strip wins over that key. A launch whose strip set
 * cannot be read starts nothing.
 *
 * Local launches go through the pause-resume pass (a `paused` record and an empty `RESUME`), as
 * `watcher-background-wait.test.mjs` does; job launches through `job <branch> task none`, with
 * `remote-run.sh` replaced by a recorder so no case reaches GitHub. Every stub path is a literal in
 * the stub body, because a local session does not inherit the recorders' own variables.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { INIT_SCRIPTS_DIR, runBash } from './helpers/fixture.mjs';
import { scaleBound } from './helpers/timing.mjs';
import { createWatcherFixture } from './helpers/watcher.mjs';

const STATE_DIR = 'sdlc-harness';
const CEILING = 'CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS';
const BASE_PROFILE = '.claude/settings.autonomous.json';
const JOB_TIMEOUT_MS = scaleBound(120_000);

/** The strip set as the shipped profile and the watcher spell it today. */
const STRIPPED = ['GH_TOKEN', 'GITHUB_TOKEN', 'HARNESS_PR_TOKEN', 'NPM_TOKEN', 'DEVSCENE_PUSH_URL', 'DEVSCENE_GIT_TOKEN'];

function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/** Each of `names` exported with a recognisable value. */
function exported(names) {
  return Object.fromEntries(names.map((name) => [name, `value-of-${name}`]));
}

/** The fixture's `harness.config.json` with `sandbox.passEnv` set to `names`, or removed for `undefined`. */
async function setPassEnv(f, names) {
  const configPath = join(f.dir, 'harness.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const sandbox = { ...(config.sandbox ?? {}) };
  if (names === undefined) delete sandbox.passEnv;
  else sandbox.passEnv = names;
  config.sandbox = sandbox;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

/** A watcher fixture whose stub records the names it was handed, and the ceiling's value. */
async function envFixture(t) {
  const f = await createWatcherFixture(t);
  if (f === null) return null;
  const namesPath = join(f.dir, 'watcher-test', 'session-env.txt');
  const ceilingPath = join(f.dir, 'watcher-test', 'session-ceiling.txt');
  await f.setStub(
    [
      `compgen -e > ${shellQuote(namesPath)}`,
      `printf '%s' "\${${CEILING}-unset}" > ${shellQuote(ceilingPath)}`,
    ].join('\n'),
  );
  return {
    ...f,
    namesPath,
    /** The names the session was handed; `null` when the stub never ran. */
    sessionNames: () => (existsSync(namesPath) ? new Set(readFileSync(namesPath, 'utf8').split('\n').filter(Boolean)) : null),
    sessionCeiling: () => readFileSync(ceilingPath, 'utf8'),
    /** One local pause-resume launch under `env`, with `passEnv` as the main checkout's key. */
    async launchLocal(passEnv, env) {
      await rm(namesPath, { force: true });
      await setPassEnv(f, passEnv);
      await f.seedRecord({ status: 'paused' });
      await mkdir(join(f.dir, STATE_DIR), { recursive: true });
      await writeFile(join(f.dir, STATE_DIR, 'RESUME'), '', 'utf8');
      await f.tick(env);
    },
  };
}

test('job mode: the session starts without the strip set, and the watcher keeps it', async (t) => {
  const f = await envFixture(t);
  if (f === null) return;
  const rec = join(f.dir, 'watcher-test');
  const runnerTemp = `${f.dir}-runner-temp`;
  t.after(() => rm(runnerTemp, { recursive: true, force: true }));
  await mkdir(runnerTemp, { recursive: true });
  const remoteRunLog = join(rec, 'remote-run.txt');
  // `pause-requested` answers 5, no pause; everything else records the token it was handed.
  await writeFile(
    join(f.dir, INIT_SCRIPTS_DIR, 'remote-run.sh'),
    [
      '#!/usr/bin/env bash',
      'case "${1-}" in pause-requested) exit 5 ;; esac',
      `printf '%s\\t%s\\n' "\${1-}" "\${GH_TOKEN-unset}" >> ${shellQuote(remoteRunLog)}`,
      'exit 0',
      '',
    ].join('\n'),
    'utf8',
  );
  await chmod(join(f.dir, INIT_SCRIPTS_DIR, 'remote-run.sh'), 0o755);

  const result = await runBash(
    f.dir,
    [f.watcherPath, 'job', f.branch, 'task', 'none'],
    f.watcherEnv({
      HARNESS_JOB_MODE: '1',
      HARNESS_INPUT_CHAIN: '',
      HARNESS_REMOTE_SLUG: '',
      HARNESS_JOB_STARTED_EPOCH: '',
      HARNESS_JOB_DEADLINE_EPOCH: '',
      RUNNER_ENVIRONMENT: '',
      REMOTE_SELF_PAUSE_AFTER_SECS: '',
      GITHUB_REPOSITORY: '',
      GITHUB_SERVER_URL: '',
      GITHUB_RUN_ID: '4242',
      RUNNER_TEMP: runnerTemp,
      REMOTE_CONTROL_POLL_SECS: '1',
      POLL_INTERVAL_SECS: '1',
      DEVSCENE_GH_CLI: join(rec, 'gh-never-called'),
      ANTHROPIC_API_KEY: 'value-of-ANTHROPIC_API_KEY',
      [CEILING]: '600000',
      ...exported(STRIPPED),
    }),
    { timeoutMs: JOB_TIMEOUT_MS, signal: t.signal },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /job: completed stop\s*$/, `${result.stdout}\n${f.watcherLog()}`);

  const names = f.sessionNames();
  assert.ok(names, `the stub never ran:\n${f.watcherLog()}`);
  for (const name of STRIPPED) assert.equal(names.has(name), false, `${name} reached the session`);
  for (const name of ['ANTHROPIC_API_KEY', 'DEVSCENE_MAIN_REPO', CEILING, 'GITHUB_RUN_ID']) {
    assert.ok(names.has(name), `${name} did not reach the session`);
  }
  assert.equal(f.sessionCeiling(), '0');

  const reports = readFileSync(remoteRunLog, 'utf8').split('\n').filter(Boolean);
  assert.ok(
    reports.some((line) => line === 'report\tvalue-of-GH_TOKEN'),
    `no remote-run.sh report after the session saw GH_TOKEN:\n${reports.join('\n')}`,
  );
});

test('locally: the session keeps only the allow-list, and the strip wins over sandbox.passEnv', async (t) => {
  const f = await envFixture(t);
  if (f === null) return;

  await t.test('an unlisted name is removed, PATH and HOME are kept', async () => {
    await f.launchLocal(undefined, exported(['SOME_CLOUD_KEY']));
    const names = f.sessionNames();
    assert.ok(names, `the stub never ran:\n${f.watcherLog()}`);
    assert.equal(names.has('SOME_CLOUD_KEY'), false);
    assert.ok(names.has('PATH') && names.has('HOME'), [...names].join(' '));
    assert.ok(names.has('DEVSCENE_MAIN_REPO'), [...names].join(' '));
    assert.equal(f.sessionCeiling(), '0');
  });

  await t.test('sandbox.passEnv brings an unlisted name back', async () => {
    await f.launchLocal(['SOME_CLOUD_KEY'], exported(['SOME_CLOUD_KEY']));
    assert.ok(f.sessionNames()?.has('SOME_CLOUD_KEY'), f.watcherLog());
  });

  await t.test('sandbox.passEnv cannot bring a stripped name back', async () => {
    await f.launchLocal(['GH_TOKEN'], exported(['GH_TOKEN']));
    const names = f.sessionNames();
    assert.ok(names, f.watcherLog());
    assert.equal(names.has('GH_TOKEN'), false);
  });

  await t.test('the HTTPS push derivation\'s names are kept with no sandbox.passEnv', async () => {
    const added = ['DBUS_SESSION_BUS_ADDRESS', 'GH_CONFIG_DIR', 'GIT_ASKPASS', 'GCM_CREDENTIAL_STORE'];
    await f.launchLocal(undefined, exported(added));
    const names = f.sessionNames();
    assert.ok(names, f.watcherLog());
    for (const name of added) assert.ok(names.has(name), `${name} did not reach the session`);
  });

  await t.test('the gateway URL and model are kept; the gateway token only once sandbox.passEnv lists it', async () => {
    const env = exported(['ANTHROPIC_BASE_URL', 'ANTHROPIC_MODEL', 'ANTHROPIC_AUTH_TOKEN']);
    await f.launchLocal(undefined, env);
    let names = f.sessionNames();
    assert.ok(names, f.watcherLog());
    assert.ok(names.has('ANTHROPIC_BASE_URL') && names.has('ANTHROPIC_MODEL'), [...names].join(' '));
    assert.equal(names.has('ANTHROPIC_AUTH_TOKEN'), false);

    await f.launchLocal(['ANTHROPIC_AUTH_TOKEN'], env);
    names = f.sessionNames();
    assert.ok(names?.has('ANTHROPIC_AUTH_TOKEN'), f.watcherLog());
  });
});

test('a refused launch starts nothing: an envVars that is not a list', async (t) => {
  const f = await envFixture(t);
  if (f === null) return;
  // `run_profile_check` does not inspect this shape, so the refusal is hr_profile_env_var_names'.
  const profilePath = join(f.dir, BASE_PROFILE);
  const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
  profile.sandbox.credentials.envVars = { name: 'GH_TOKEN', mode: 'deny' };
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');

  await f.launchLocal(undefined, {});

  const record = f.record();
  assert.equal(record.status, 'failed', JSON.stringify(record));
  assert.ok(!record.pid, `a pid stayed attached: ${JSON.stringify(record)}`);
  const failed = f.notifications().filter((n) => n.event === 'failed');
  assert.equal(failed.length, 1, JSON.stringify(f.notifications()));
  assert.match(failed[0].detail, /^not launched:/);
  assert.match(failed[0].detail, /envVars/);
  assert.equal(existsSync(f.namesPath), false, 'the agent stub ran');
});
